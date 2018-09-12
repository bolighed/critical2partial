import { generate } from '../index'
import yargs from 'yargs';
import * as fs from 'mz/fs';
import * as Path from 'path';
import { Critical, FileConfig } from '../types';
import * as util from 'util';
import * as os from 'os';

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
            describe: 'Number of concurrently running tabs (defaults to number of cpus)',
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


    const result = await generate(config, {
        browsers: argv.browsers,
        concurrency: argv.pages
    });

    let out = result.map(m => {
        if (m.error) m.error = m.error.message as any;
        return m
    })

    await fs.writeFile("critical-log.json", JSON.stringify(out, null, 2));


}