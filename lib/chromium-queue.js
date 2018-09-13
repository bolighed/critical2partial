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
const chalk_1 = __importDefault(require("chalk"));
const utils_1 = require("./utils");
function ensurepath(path) {
    return new Promise((res, rej) => {
        mkdirp_1.default(path, (err) => {
            res();
        });
    });
}
class ChromiumQueue {
    constructor(tasks, options = {}) {
        this.tasks = tasks;
        this.options = options;
        this.pages = [];
        this.concurrency = this.options.concurrency || 10;
        this.logger = this.options.logger || new utils_1.Logger();
        this.queue = new queue_1.Queue({
            tasks: tasks,
            worker: this.work.bind(this),
            concurrency: this.concurrency,
            bailOnError: options.bailOnError
        });
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            this.browser = yield puppeteer_1.launch(Object.assign({
                headless: true,
                handleSIGINT: true,
                args: void 0
            }, this.options.launchOptions || {}));
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
                throw e;
            }
            yield this.browser.close();
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
            debug('set viewport %s', config.url);
            yield page.setViewport({
                width: config.critical.width || 800,
                height: config.critical.height || 600
            });
            try {
                debug('goto page %s', config.url);
                yield page.goto(config.url, {
                    waitUntil: 'networkidle2'
                });
                if (config.delay)
                    yield utils_1.delay(config.delay);
                debug('fetching html %s', config.url);
                const html = yield page.evaluate(() => {
                    return document.documentElement.innerHTML;
                });
                debug('generating critical %s', config.url);
                const out = yield Gen.generate(Object.assign({
                    html
                }, config.critical));
                const dest = Path.resolve(config.dest), dirname = Path.dirname(config.dest);
                debug('writing file %s: %s', config.url, dest);
                yield ensurepath(dirname);
                yield fs.writeFile(dest, `<style>${out}</style>`);
                this.logger.log("  %s: %s => %s", chalk_1.default.green("OK"), config.url, chalk_1.default.cyan(config.dest));
                yield utils_1.delay(200);
            }
            catch (e) {
                debug('error %s: %s', config.url, e.message);
                this.pages.push(page);
                this.logger.log("  %s: %s", chalk_1.default.red("FAIL"), chalk_1.default.cyan(config.url));
                this.logger.log("    %s", chalk_1.default.grey(e.message));
                yield utils_1.delay(200);
                throw e;
            }
            this.pages.push(page);
        });
    }
}
exports.ChromiumQueue = ChromiumQueue;
