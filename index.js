const critical = require('critical');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

module.exports = (CONFIG) => {
    const generateCritical = function(url, file_path) {

        if (url.startsWith("http")) {
            console.log("fetching url: ", url)
            fetch(url).then((data) => {
                return data.text()
            }).then((body) => {
                Object.assign(CONFIG.critical_options, {html: body});
                generateCriticalFile(CONFIG, file_path)
            })
        } else {
            console.log("reading file:", path.resolve(url));
            const body = fs.readFileSync(path.resolve(url), 'utf8');
            Object.assign(CONFIG.critical_options, {html: body});
            generateCriticalFile(CONFIG, file_path)
        }

    }

    const generateCriticalFile = function(CONFIG, file_path) {
        critical.generate(CONFIG.critical_options)
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
        generateCritical(page.static_file, page.output_file);
    });
}