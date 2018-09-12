import { generate } from '../index'
import yargs from 'yargs';
import * as fs from 'mz/fs';
import * as Path from 'path';
import { FileConfig, Logger } from '../types';
import * as os from 'os';
import { Writable } from 'stream';

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
        .demandOption(['config'], 'Please provide a Configuration file')
        .help()
        .argv;

    const resolvedPath = Path.resolve(argv.config);

    let config: FileConfig[] | undefined;
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
        }
        config = input;
        if (!Array.isArray(config)) throw new TypeError('invalid input');
    } catch (e) {
        throw e;
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
        concurrency: argv.pages
    }, new Logger(output));

    let out = result.map(m => {
        if (m.error) m.error = m.error.message as any;
        return m
    })

    if (argv.report) {
        await fs.writeFile(argv.report, JSON.stringify(out, null, 2));
    }

}