import { Queue, Result } from './queue';
import { Critical, FileConfig } from './types';
import { Browser, Page, launch } from 'puppeteer';
import mkdirp from 'mkdirp';
import * as Gen from 'critical';
import * as Path from 'path';
import * as fs from 'mz/fs';
import Debug from 'debug';
const debug = Debug('bo-critical:queue');

function ensurepath(path: string) {
    return new Promise((res, rej) => {
        mkdirp(path, (err) => {
            res();
        });
    });
}

function delay(timeout: number = 0) {
    return new Promise((res) => {
        setTimeout(() => {
            res();
        }, timeout);
    })
}



export class ChromiumQueue {
    private queue: Queue<FileConfig>;
    private browser: Browser | undefined;
    private pages: Page[] = [];

    constructor(private tasks: FileConfig[], private concurrency: number = 10) {
        this.queue = new Queue(tasks, this.work.bind(this), this.concurrency);
    }

    async run() {

        this.browser = await launch({
            headless: true,
            handleSIGINT: true,
            args: void 0
        });

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
            //process.setMaxListeners(old);
            throw e;
        }

        await this.browser.close();

        //process.setMaxListeners(old);

        Object.freeze(this);
        Object.freeze(this.tasks)

        return result;
    }


    private async work(config: FileConfig) {
        let page = this.pages.pop()!;

        if (!page || page.isClosed()) {
            page = await this.browser!.newPage();
        }

        await page.setViewport({
            width: config.critical.width || 800,
            height: config.critical.height || 600
        });

        try {

            await page.goto(config.url, {
                waitUntil: 'networkidle2'
            });


            if (config.delay)
                await delay(config.delay);


            const html = await page.evaluate(() => {
                return document.documentElement.innerHTML;
            });

            const out = await Gen.generate(Object.assign({
                html
            }, config.critical));


            const dest = Path.resolve(config.dest),
                dirname = Path.dirname(config.dest);

            await ensurepath(dirname);
            await fs.writeFile(dest, `<style>${out}</style>`);


        } catch (e) {
            this.pages.push(page);
            throw e;
        }

        this.pages.push(page);

    }


}