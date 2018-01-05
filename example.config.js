const path = require('path');

module.exports = config = {
    files: [{
        critical_options: {
            base: path.join(__dirname, '../../../backend'),
            folder: 'assets',
            ignore: [
                "@font-face"
            ],
            width: 1300,
            height: 900,
            minify: true
        },
        static_file: 'http://localhost:18000/bolig/aarhus-c/8000/thorvaldsensgade/1/1/th/sundhed',
        output_file: '../../../backend/home/templates/home/critical.home.html'
    }]
}