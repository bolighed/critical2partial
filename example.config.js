module.exports = config = {
    critical_options: {
        base: path.join(__dirname, '../../../backend'),
        folder: 'assets',
        html: body,
        ignore: [
            "@font-face"
        ],
        width: 1300,
        height: 900,
        minify: true
    },
    files: [{
        static_file: '../../../backend/home/templates-static/home/home.html',
        output_file: '../../../backend/home/templates/home/critical.home.html'
    }]
}