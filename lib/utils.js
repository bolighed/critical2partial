"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function delay(timeout = 0) {
    return new Promise((res) => {
        setTimeout(() => {
            res();
        }, timeout);
    });
}
exports.delay = delay;
