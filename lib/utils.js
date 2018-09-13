"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
const util_1 = require("util");
const strip_ansi_1 = __importDefault(require("strip-ansi"));
function delay(timeout = 0) {
    return new Promise((res) => {
        setTimeout(() => {
            res();
        }, timeout);
    });
}
exports.delay = delay;
class NullWriter extends stream_1.Writable {
}
class Logger {
    constructor(out = new NullWriter) {
        this.out = out;
        this.colors = this.out === process.stdout && !!process.stdout.isTTY;
    }
    log(fmt, ...args) {
        let str = util_1.format(fmt + '\n', ...args);
        if (!this.colors)
            str = strip_ansi_1.default(str);
        this.out.write(str);
    }
}
exports.Logger = Logger;
