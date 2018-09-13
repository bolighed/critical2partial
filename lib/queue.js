"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const utils_1 = require("./utils");
exports.Concurrency = 10;
class Queue {
    constructor(options) {
        this._running = 0;
        this._emitter = new events_1.EventEmitter();
        this._results = [];
        this._bail = false;
        this.tasks = options.tasks;
        this.worker = options.worker;
        this.bailOnError = !!options.bailOnError;
        this.concurrency = options.concurrency || exports.Concurrency;
    }
    run() {
        return new Promise((res, rej) => {
            this._emitter.once('done', res);
            this._emitter.once('error', rej);
            while (this._running <= this.concurrency) {
                if (this._bail)
                    break;
                if (this.tasks.length == 0)
                    break;
                this._runTask(this.tasks.pop());
            }
        });
    }
    _runTask(config) {
        this._running++;
        const done = (error) => {
            if (error && this.bailOnError) {
                this._emitter.emit('error', error);
                return;
            }
            this._results.push({ config, error, status: error ? 'fail' : 'ok' });
            this._running--;
            if (this.tasks.length && this._running < this.concurrency)
                this._runTask(this.tasks.pop());
            if (this._running === 0 && this.tasks.length === 0)
                this._emitter.emit('done', this._results);
        };
        return utils_1.delay(100).then(() => this.worker(config)).then(() => done(), done);
    }
}
exports.Queue = Queue;
