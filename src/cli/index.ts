import { generate } from '../index'
import yargs from 'yargs';
import * as fs from 'mz/fs';
import * as Path from 'path';
import { FileConfig } from '../types';
import * as os from 'os';
import { Writable } from 'stream';
import { Logger } from '../utils';
import { LaunchOptions, launch } from 'puppeteer';

export async function run() {
    const argv = yargs
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
        .option('chromium-executable', {
            describe: 'Path to chromium executable',
            type: 'string'
        })
        .option('chromium-args', {
            describe: 'Path to chromium executable',
            type: 'array',
        })
        .demandOption(['config'], 'Please provide a Configuration file')
        .help()
        .argv;

    const resolvedPath = Path.resolve(argv.config);


    // Old config style
    let config: FileConfig[] | undefined;
    let launchOptions: LaunchOptions = {}
    try {
        let input = require(resolvedPath);
        if (!Array.isArray(input)) {
            input = input.files.map((m: any) => {
                return {
                    url: m.static_file,
                    dest: m.output_file,
                    critical: m.critical_options
                };
            })
            if (input.browser_args)
                launchOptions = {
                    args: input.browser_args
                };
        }
        config = input;
        if (!Array.isArray(config)) throw new TypeError('invalid input');
    } catch (e) {
        throw e;
    }


    if (argv['chromium-executable']) {
        launchOptions.executablePath = argv['chromium-executable'];
    }

    if (argv['chromium-args']) {

        let args = argv['chromium-args'].map((m: string) => {
            if (!m.startsWith('--'))
                m = '--' + m;
            return m;
        })

        if (Array.isArray(launchOptions.args))
            launchOptions.args.push(...args)
        else
            launchOptions.args = args;
    }

    let output: Writable = process.stdout;
    if (argv.log) {
        if (argv.log == 'stderr')
            argv.log = process.stderr;
        else if (argv.log != 'stdout')
            output = fs.createWriteStream(argv.log);
    }


    const result = await generate(config, {
        browsers: argv.browsers,
        concurrency: argv.pages,
        bailOnError: !!argv.bail,
        launchOptions: launchOptions
    }, new Logger(output));

    let out = result.map(m => {
        if (m.error) m.error = m.error.message as any;
        return m
    })


    if (out.filter(m => m.status == 'fail').length) {
        process.exitCode = 2;
    }

    if (argv.report) {
        await fs.writeFile(argv.report, JSON.stringify(out, null, 2));
    }

}