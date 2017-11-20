module.exports = config = {
    critical_path: '../../backend',
    critical_assets_folder: 'assets',
    static_folder: '../../backend/home/templates-static/',
    output_folder: '../../backend/home/templates/',
    files: [{
        static_file: 'home/home.html',
        output_file: 'home/critical.home.html'
    }]
}