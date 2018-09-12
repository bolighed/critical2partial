"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("util");
class Logger {
    constructor(out) {
        this.out = out;
    }
    log(fmt, ...args) {
        this.out.write(util_1.format(fmt, ...args));
    }
}
exports.Logger = Logger;
