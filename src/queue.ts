import { Critical } from './types';
import { EventEmitter } from 'events';
import { delay } from './utils';

export const Concurrency = 10;


export type Worker<T> = (config: T) => Promise<any>


export interface QueueOptions<T> {
    tasks: T[];
    worker: Worker<T>;
    concurrency?: number;
    bailOnError?: boolean;
}


export interface Result<T> {
    config: T;
    status: 'ok' | 'fail';
    error?: Error;
}

export class Queue<T> {
    private _running = 0;
    private _emitter = new EventEmitter();
    private _results: Result<T>[] = [];
    private _bail = false;

    private tasks: T[];
    private worker: Worker<T>
    private bailOnError: boolean;
    private concurrency: number;

    constructor(options: QueueOptions<T>) {
        this.tasks = options.tasks;
        this.worker = options.worker;
        this.bailOnError = !!options.bailOnError;
        this.concurrency = options.concurrency || Concurrency;
    }


    run() {
        return new Promise<Result<T>[]>((res, rej) => {

            this._emitter.once('done', res);
            this._emitter.once('error', rej);

            while (this._running <= this.concurrency) {
                if (this._bail) break;
                if (this.tasks.length == 0) break;
                this._runTask(this.tasks.pop()!);
            }

        });
    }

    _runTask(config: T) {
        this._running++;

        const done = (error?: Error) => {
            console.log(error, this.bailOnError)
            if (error && this.bailOnError) {
                this._emitter.emit('error', error);
                return;
            }

            this._results.push({ config, error, status: error ? 'fail' : 'ok' });
            this._running--;
            if (this.tasks.length && this._running < this.concurrency)
                this._runTask(this.tasks.pop()!);

            if (this._running === 0 && this.tasks.length === 0)
                this._emitter.emit('done', this._results);
        }

        return delay(100).then(() => this.worker(config)).then(() => done(), done)

    }

}