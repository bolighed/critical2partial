"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const queue_1 = require("./queue");
const puppeteer_1 = require("puppeteer");
const mkdirp_1 = __importDefault(require("mkdirp"));
const Gen = __importStar(require("critical"));
const Path = __importStar(require("path"));
const fs = __importStar(require("mz/fs"));
const debug_1 = __importDefault(require("debug"));
const debug = debug_1.default('bo-critical:queue');
function ensurepath(path) {
    return new Promise((res, rej) => {
        mkdirp_1.default(path, (err) => {
            res();
        });
    });
}
function delay(timeout = 0) {
    return new Promise((res) => {
        setTimeout(() => {
            res();
        }, timeout);
    });
}
class ChromiumQueue {
    constructor(tasks, concurrency = 10) {
        this.tasks = tasks;
        this.concurrency = concurrency;
        this.pages = [];
        this.queue = new queue_1.Queue(tasks, this.work.bind(this), this.concurrency);
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            this.browser = yield puppeteer_1.launch({
                headless: true,
                handleSIGINT: true,
                args: void 0
            });
            debug('opening pages %d', this.concurrency);
            const promises = [];
            for (let i = 0; i < this.concurrency; i++) {
                promises.push(this.browser.newPage());
            }
            this.pages = yield Promise.all(promises);
            debug('pages opened');
            let result;
            try {
                result = yield this.queue.run();
            }
            catch (e) {
                yield this.browser.close();
                //process.setMaxListeners(old);
                throw e;
            }
            yield this.browser.close();
            //process.setMaxListeners(old);
            Object.freeze(this);
            Object.freeze(this.tasks);
            return result;
        });
    }
    work(config) {
        return __awaiter(this, void 0, void 0, function* () {
            let page = this.pages.pop();
            if (!page || page.isClosed()) {
                page = yield this.browser.newPage();
            }
            yield page.setViewport({
                width: config.critical.width || 800,
                height: config.critical.height || 600
            });
            try {
                yield page.goto(config.url, {
                    waitUntil: 'networkidle2'
                });
                if (config.delay)
                    yield delay(config.delay);
                const html = yield page.evaluate(() => {
                    return document.documentElement.innerHTML;
                });
                const out = yield Gen.generate(Object.assign({
                    html
                }, config.critical));
                const dest = Path.resolve(config.dest), dirname = Path.dirname(config.dest);
                yield ensurepath(dirname);
                yield fs.writeFile(dest, `<style>${out}</style>`);
            }
            catch (e) {
                this.pages.push(page);
                throw e;
            }
            this.pages.push(page);
        });
    }
}
exports.ChromiumQueue = ChromiumQueue;
