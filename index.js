const critical = require('critical');
const fs = require('fs');
const path = require('path');

module.exports = (CONFIG) => {
    const generateCritical = function(url, file_path) {
        const body = fs.readFileSync(path.join(__dirname, CONFIG.static_folder, url), 'utf8');
    
        critical.generate({
            base: path.join(__dirname, CONFIG.critical_path),
            folder: CONFIG.critical_assets_folder,
            html: body,
            width: 1300,
            height: 900,
            minify: true
        }).then(function (output) {
            output = '<style>'+output+'</style>';
            const output_file_path = path.join(__dirname, file_path);
            fs.writeFile(output_file_path, output, (err) => {
                if (err) throw err;
                console.log(`${output_file_path} generated!`);
            });
        }).error(function (err) {
            console.log('err',err.message || err);
        });
    }
    
    CONFIG.files.forEach((page) => {
        generateCritical(page.static_file, page.output_file);
    });
}