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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const yargs_1 = __importDefault(require("yargs"));
const fs = __importStar(require("mz/fs"));
const Path = __importStar(require("path"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const argv = yargs_1.default
            .option('config', {
            alias: 'c',
            describe: 'Configuration file',
            type: 'string',
            required: true
        })
            .demandOption(['config'], 'Please provide a Configuration file')
            .help()
            .argv;
        const resolvedPath = Path.resolve(argv.config);
        let config;
        try {
            let input = require(resolvedPath);
            if (!Array.isArray(input)) {
                input = input.files.map((m) => {
                    return {
                        url: m.static_file,
                        dest: m.output_file,
                        critical: m.critical_options
                    };
                });
            }
            config = input;
            if (!Array.isArray(config))
                throw new TypeError('invalid input');
        }
        catch (e) {
            throw e;
        }
        // for (let i = 0; i < 15; i++) {
        //     config = config.concat(config);
        // }
        //console.log(config);
        const result = yield index_1.generate(config);
        let out = result.map(m => {
            if (m.error)
                m.error = m.error.message;
            return m;
        });
        yield fs.writeFile("critical-log.json", JSON.stringify(out, null, 2));
        //console.log(util.inspect(result, false, 10, true));
    });
}
exports.run = run;