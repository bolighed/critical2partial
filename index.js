const critical = require('critical');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

module.exports = (CONFIG) => {
    const generateCritical = async function(critical_options, url, file_path) {

        if (url.startsWith("http")) {
            console.log("fetching url: ", url)

            const browser = await puppeteer.launch({
                headless: true,
            });

            // Create a new page
            const page = await browser.newPage();
        
            // Set some dimensions to the screen
            page.setViewport({
                width: critical_options.width,
                height: critical_options.height
            });
        
            // Navigate to Our Code World
            await page.goto(url, {waitUntil: 'networkidle2'});
        
            // Create a screenshot of Our Code World website
            // await page.waitForSelector("")
    
            await page.evaluate(() => {
                return document.documentElement.innerHTML;
            })
            .then((body) => {
                Object.assign(critical_options, {html: body});
                generateCriticalFile(critical_options, file_path)
            });

            browser.close();

        } else {
            console.log("reading file:", path.resolve(url));
            const body = fs.readFileSync(path.resolve(url), 'utf8');
            Object.assign(critical_options, {html: body});
            generateCriticalFile(critical_options, file_path)
        }

    }

    const generateCriticalFile = function(critical_options, file_path) {
        critical.generate(critical_options)
        .then(function (output) {
            output = '<style>'+output+'</style>';
            const output_file_path = path.resolve(file_path);
            fs.writeFile(output_file_path, output, (err) => {
                if (err) throw err;
                console.log(`${output_file_path} generated!`);
            });
        }).error(function (err) {
            if (err) throw err;
        });
    }
    
    CONFIG.files.forEach((page) => {
        generateCritical(page.critical_options ,page.static_file, page.output_file);
    });
}