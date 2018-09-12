"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const utils_1 = require("./utils");
exports.Concurrency = 10;
class Queue {
    constructor(tasks, fn, concurrency = exports.Concurrency) {
        this.tasks = tasks;
        this.fn = fn;
        this.concurrency = concurrency;
        this._running = 0;
        this._emitter = new events_1.EventEmitter();
        this._results = [];
    }
    run() {
        return new Promise((res) => {
            this._emitter.once('done', res);
            while (this._running <= this.concurrency) {
                if (this.tasks.length == 0)
                    break;
                this._runTask(this.tasks.pop());
            }
        });
    }
    _runTask(config) {
        this._running++;
        const done = (error) => {
            this._results.push({ config, error, status: error ? 'fail' : 'ok' });
            this._running--;
            if (this.tasks.length && this._running < this.concurrency)
                this._runTask(this.tasks.pop());
            if (this._running === 0 && this.tasks.length === 0)
                this._emitter.emit('done', this._results);
        };
        return utils_1.delay(100).then(() => this.fn(config)).then(() => done(), done);
    }
}
exports.Queue = Queue;
