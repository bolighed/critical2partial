import { Writable } from 'stream';
import { format } from 'util';
import strip from 'strip-ansi';

export function delay(timeout: number = 0) {
    return new Promise((res) => {
        setTimeout(() => {
            res();
        }, timeout);
    })
}



class NullWriter extends Writable { }

export class Logger {
    colors: boolean;
    constructor(private out: Writable = new NullWriter) {
        this.colors = this.out === process.stdout && !!process.stdout.isTTY
    }

    log(fmt: string, ...args: any[]) {
        let str = format(fmt + '\n', ...args);
        if (!this.colors) str = strip(str);
        this.out.write(str);
    }
}