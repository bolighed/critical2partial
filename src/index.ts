import { FileConfig, Critical } from './types';
import * as Gen from 'critical';
import { Queue, Result } from './queue';
import puppeteer from 'puppeteer';
import mkdirp from 'mkdirp';
import * as Path from 'path';
import * as fs from 'mz/fs';
import Debug from 'debug';
const debug = Debug('bo-critical');

function ensurepath(path: string) {
    return new Promise((res, rej) => {
        mkdirp(path, (err) => {
            //if (err) return rej(err);
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

async function worker(pages: puppeteer.Page[], config: FileConfig) {

    const page = pages.pop()!;

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
        console.log(`write file ${dest}`);

    } catch (e) {
        pages.push(page);
        throw e;
    }

    pages.push(page);
    // if (!page.isClosed())
    //     await page.close();

}


export async function generate(config: FileConfig[]) {
    const old = process.getMaxListeners();
    process.setMaxListeners(Infinity);

    const browser = await puppeteer.launch({
        headless: true,
        handleSIGINT: true,
        args: void 0
    });

    debug('opening pages');
    const promises: Promise<puppeteer.Page>[] = []
    for (let i = 0; i < 12; i++) {
        promises.push(browser.newPage());
    }

    const pages = await Promise.all(promises);
    debug('pages opened');
    const queue = new Queue(config, worker.bind(void 0, pages));

    let result: Result<FileConfig>[] | undefined;

    try {
        result = await queue.run();
    } catch (e) {
        await browser.close();
        process.setMaxListeners(old);
        throw e;
    }

    await browser.close();

    process.setMaxListeners(old);

    return result;

}   