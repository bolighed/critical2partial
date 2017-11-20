module.exports = config = {
    critical_path: '../../backend',
    critical_assets_folder: 'assets',
    files: [{
        static_file: '../../backend/home/templates-static/home/home.html',
        output_file: '../../backend/home/templates/home/critical.home.html'
    }]
}