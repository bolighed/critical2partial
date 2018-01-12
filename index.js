const critical = require('critical');
const fs = require('fs');
const path = require('path');
const util = require('util');
const puppeteer = require('puppeteer');

process.setMaxListeners(Infinity); // <== Important line

const writeFile = util.promisify(fs.writeFile);

let browser;

const args = [
    // '--disable-gpu',
    // `--window-size=${ resolution.x },${ resolution.y }`,
    // '--no-sandbox',
];

const work = async (file) => {
    // console.log("file", file)
    const page = await browser.newPage();

    await page.setViewport({
        width: file.critical_options.width,
        height: file.critical_options.height
    })

    try {
        await page.goto(file.static_file, { waitUntil: 'networkidle2' });
    } catch (error) {
        page.close();
        throw error;
    }

    const body = await page.evaluate(() => {
        return document.documentElement.innerHTML;
    });

    const output_file_path = path.resolve(file.output_file);

    let output;

    try {
        output = await critical.generate(Object.assign(file.critical_options, { html: body }))
        output = '<style>' + output + '</style>';
    } catch (error) {
        page.close();
        throw error
    }

    try {
        await writeFile(output_file_path, output);
        console.log(`${output_file_path} generated!`);
    } catch (error) {
        page.close();
        throw error;
    }

    await page.close();
}


Object.defineProperty(Array.prototype, 'chunk', {
    value: function(chunkSize) {
        var R = [];
        for (var i=0; i<this.length; i+=chunkSize)
            R.push(this.slice(i,i+chunkSize));
        return R;
    }
});

module.exports = (CONFIG) => {

    async function run(files) {
        const promised = CONFIG.files.map((file) => work(file))
        await Promise.all(promised)
    }

    const generateCritical = async (CONFIG) => {
        browser = await puppeteer.launch({
          headless     : true,
          handleSIGINT : false,
          args: args
        })

        const chunks = CONFIG.files.chunk(2)

        async function run(chunks) {
            for(const chunk of chunks) {
                const promised = chunk.map((file) => work(file))
                await Promise.all(promised)
            }
        };
        await run(chunks);

        await browser.close();

        console.log('DONE');
    }
    
    generateCritical(CONFIG)
}