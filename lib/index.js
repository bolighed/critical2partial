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
Object.defineProperty(exports, "__esModule", { value: true });
const chromium_queue_1 = require("./chromium-queue");
const lodash_flatten_1 = __importDefault(require("lodash.flatten"));
const debug_1 = __importDefault(require("debug"));
const debug = debug_1.default('bo-critical');
function splitArrayIntoChunks(arr, chunkLen) {
    var chunkList = [];
    var chunkCount = chunkLen;
    chunkLen = Math.ceil(arr.length / chunkCount);
    for (var i = 0; i < chunkCount; i++) {
        chunkList.push(arr.splice(0, chunkLen));
    }
    return chunkList;
}
exports.splitArrayIntoChunks = splitArrayIntoChunks;
function generate(files, options, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const old = process.getMaxListeners();
        process.setMaxListeners(Infinity);
        debug('creating %i queue', options.browsers || 1);
        const queues = splitArrayIntoChunks(files, options.browsers || 1).map(m => new chromium_queue_1.ChromiumQueue(m, {
            concurrency: options.concurrency,
            launchOptions: options.launchOptions,
            logger: logger
        }));
        const results = yield Promise.all(queues.map(m => m.run()));
        process.setMaxListeners(old);
        return lodash_flatten_1.default(results);
    });
}
exports.generate = generate;
