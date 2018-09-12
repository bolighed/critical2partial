import { Critical } from './types';
import { EventEmitter } from 'events';
import { delay } from './utils';

export const Concurrency = 10;



export interface Result<T> {
    config: T;
    status: 'ok' | 'fail';
    error?: Error;
}

export class Queue<T> {
    private _running = 0;
    private _emitter = new EventEmitter();
    private _results: Result<T>[] = [];
    constructor(private tasks: T[], private fn: (config: T) => Promise<any>, public concurrency = Concurrency) { }


    run() {
        return new Promise<Result<T>[]>((res) => {

            this._emitter.once('done', res);

            while (this._running <= this.concurrency) {
                if (this.tasks.length == 0) break;
                this._runTask(this.tasks.pop()!);
            }

        });
    }

    _runTask(config: T) {
        this._running++;

        const done = (error?: Error) => {
            this._results.push({ config, error, status: error ? 'fail' : 'ok' });
            this._running--;
            if (this.tasks.length && this._running < this.concurrency)
                this._runTask(this.tasks.pop()!);

            if (this._running === 0 && this.tasks.length === 0)
                this._emitter.emit('done', this._results);
        }

        return delay(100).then(() => this.fn(config)).then(() => done(), done)

    }

}