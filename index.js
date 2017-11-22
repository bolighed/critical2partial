const critical = require('critical');
const fs = require('fs');
const path = require('path');

module.exports = (CONFIG) => {
    const generateCritical = function(url, file_path) {
        const body = fs.readFileSync(path.join(__dirname, url), 'utf8');
        
        Object.assign(CONFIG.critical_options, {html: body});
    
        critical.generate(CONFIG.critical_options).then(function (output) {
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
