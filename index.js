const critical = require('critical');
const fs = require('fs');
const path = require('path');
const util = require('util');
const puppeteer = require('puppeteer');

process.setMaxListeners(Infinity); // <== Important line

const writeFile = util.promisify(fs.writeFile);

let browser;
let page;

process.on('uncaughtException', function(err) {
    console.log('Caught exception: ' + err);
});

const work = async (file) => {

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
        console.log("ERROR: problem generating the criticall CSS");
        page.close();
        throw error;
    }

    try {
        await writeFile(output_file_path, output);
        console.log(`${output_file_path} generated!`);
    } catch (error) {
        console.log("ERROR: problem writing the file ${output_file_path}");
        page.close();
        throw error;
    }
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
          handleSIGINT : true,
          args: CONFIG.browser_args
        })

        page = await browser.newPage();

        const chunks = CONFIG.files.chunk(CONFIG.parallel_tabs || 2);

        async function run(chunks) {
            for(const chunk of chunks) {
                const promised = chunk.map((file) => work(file))
                await Promise.all(promised)
            }
        };

        await run(chunks).then(() => {
            console.log(`DONE! ${CONFIG.files.length} file${CONFIG.files.length > 1 ? 's' : ''} generated`);
        }).catch((error) => {
            console.log("DONE WITH ERRORS: ", error);
        });

        await page.close();

        await browser.close();
    }
    
    generateCritical(CONFIG)
}