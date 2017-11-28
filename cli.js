#!/usr/bin/env node

const yargs = require('yargs');
const criticalTool = require('./index');

const argv_config = yargs
    .option('config', {
        alias: 'c',
        describe: 'Configuration file',
        type: 'string'
    })
    .demandOption(['config'], 'Please provide a Configuration file')
    .help()
    .argv

if (argv_config) {
    const config = require(argv_config.config);
    criticalTool(config)
}