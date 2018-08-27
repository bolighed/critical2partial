import { ChromiumQueue } from './chromium-queue';
import { FileConfig } from './types';
import flatten from 'lodash.flatten'
import Debug from 'debug';
const debug = Debug('bo-critical');

export interface Options {
    concurrency?: number;
    browsers?: number;
}


export function splitArrayIntoChunks<T>(arr: Array<T>, chunkLen: number) {
    var chunkList = []
    var chunkCount = chunkLen;
    chunkLen = Math.ceil(arr.length / chunkCount);

    for (var i = 0; i < chunkCount; i++) {
        chunkList.push(arr.splice(0, chunkLen))
    }

    return chunkList
}

export async function generate(files: FileConfig[], options: Options) {

    const old = process.getMaxListeners();
    process.setMaxListeners(Infinity);

    debug('creating %i queue', options.browsers || 1);

    const queues = splitArrayIntoChunks(files, options.browsers || 1).map(m => new ChromiumQueue(m, options.concurrency));

    const results = await Promise.all(queues.map(m => m.run()));

    process.setMaxListeners(old);

    return flatten(results);

}

