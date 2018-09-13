import { Queue, Result } from './queue';
import { FileConfig } from './types';
import { Browser, Page, launch, LaunchOptions } from 'puppeteer';
import mkdirp from 'mkdirp';
import * as Gen from 'critical';
import * as Path from 'path';
import * as fs from 'mz/fs';
import Debug from 'debug';
const debug = Debug('bo-critical:queue');
import chalk from 'chalk';
import { delay, Logger } from './utils';

function ensurepath(path: string) {
    return new Promise((res, rej) => {
        mkdirp(path, (err) => {
            res();
        });
    });
}



export interface ChromiumQueueOptions {
    concurrency?: number;
    launchOptions?: LaunchOptions
    logger?: Logger;
    bailOnError?: boolean;
}


export class ChromiumQueue {
    private queue: Queue<FileConfig>;
    private browser: Browser | undefined;
    private concurrency: number;
    private pages: Page[] = [];
    private logger: Logger;

    constructor(private tasks: FileConfig[], private options: ChromiumQueueOptions = {}) {
        this.concurrency = this.options.concurrency || 10;
        this.logger = this.options.logger || new Logger();
        this.queue = new Queue({
            tasks: tasks,
            worker: this.work.bind(this),
            concurrency: this.concurrency,
            bailOnError: options.bailOnError
        })
    }

    async run() {

        this.browser = await launch(Object.assign({
            headless: true,
            handleSIGINT: true,
            args: void 0
        }, this.options.launchOptions || {}));

        debug('opening pages %d', this.concurrency);
        const promises: Promise<Page>[] = []
        for (let i = 0; i < this.concurrency; i++) {
            promises.push(this.browser.newPage());
        }

        this.pages = await Promise.all(promises);
        debug('pages opened');

        let result: Result<FileConfig>[] | undefined;

        try {
            result = await this.queue.run();
        } catch (e) {
            await this.browser.close();
            throw e;
        }

        await this.browser.close();

        Object.freeze(this);
        Object.freeze(this.tasks)

        return result;
    }


    private async work(config: FileConfig) {
        let page = this.pages.pop()!;

        if (!page || page.isClosed()) {
            page = await this.browser!.newPage();
        }

        debug('set viewport %s', config.url)
        await page.setViewport({
            width: config.critical.width || 800,
            height: config.critical.height || 600
        });

        try {

            debug('goto page %s', config.url)
            await page.goto(config.url, {
                waitUntil: 'networkidle2'
            });


            if (config.delay)
                await delay(config.delay);

            debug('fetching html %s', config.url)
            const html = await page.evaluate(() => {
                return document.documentElement.innerHTML;
            });

            debug('generating critical %s', config.url)
            const out = await Gen.generate(Object.assign({
                html
            }, config.critical));


            const dest = Path.resolve(config.dest),
                dirname = Path.dirname(config.dest);

            debug('writing file %s: %s', config.url, dest);
            await ensurepath(dirname);
            await fs.writeFile(dest, `<style>${out}</style>`);
            this.logger.log("  %s: %s => %s", chalk.green("OK"), config.url, chalk.cyan(config.dest));
            await delay(200);
        } catch (e) {
            debug('error %s: %s', config.url, e.message);
            this.pages.push(page);

            this.logger.log("  %s: %s", chalk.red("FAIL"), chalk.cyan(config.url));
            this.logger.log("    %s", chalk.grey(e.message));
            await delay(200);
            throw e;
        }

        this.pages.push(page);

    }


}