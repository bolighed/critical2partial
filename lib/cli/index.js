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
const os = __importStar(require("os"));
const utils_1 = require("../utils");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const argv = yargs_1.default
            .option('config', {
            alias: 'c',
            describe: 'Configuration file',
            type: 'string',
            required: true
        })
            .option('pages', {
            alias: 'p',
            type: 'number',
            describe: 'Number of concurrent running tabs (defaults to number of cpus)',
            default: os.cpus().length
        })
            .option('browsers', {
            alias: 'b',
            type: 'number',
            describe: 'How many browsers to spawn.',
            default: 1
        })
            .option('log', {
            alias: 'l',
            type: "string",
            describe: "Direct output to file. Can be 'stdout', 'stderr' or path. Defaults to stdout"
        })
            .option('report', {
            alias: 'r',
            type: 'string',
            describe: "json file with more details"
        })
            .option('bail', {
            describe: 'Bail on error'
        })
            .demandOption(['config'], 'Please provide a Configuration file')
            .help()
            .argv;
        const resolvedPath = Path.resolve(argv.config);
        // Old config style
        let config;
        let launchOptions = {};
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
                if (input.browser_args)
                    launchOptions = input.browser_args;
            }
            config = input;
            if (!Array.isArray(config))
                throw new TypeError('invalid input');
        }
        catch (e) {
            throw e;
        }
        let output = process.stdout;
        if (argv.log) {
            if (argv.log == 'stderr')
                argv.log = process.stderr;
            else if (argv.log != 'stdout')
                output = fs.createWriteStream(argv.log);
        }
        const result = yield index_1.generate(config, {
            browsers: argv.browsers,
            concurrency: argv.pages,
            bailOnError: !!argv.bail,
            launchOptions: launchOptions
        }, new utils_1.Logger(output));
        let out = result.map(m => {
            if (m.error)
                m.error = m.error.message;
            return m;
        });
        if (out.filter(m => m.status == 'fail').length) {
            process.exitCode = 2;
        }
        if (argv.report) {
            yield fs.writeFile(argv.report, JSON.stringify(out, null, 2));
        }
    });
}
exports.run = run;
