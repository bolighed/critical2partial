# critical2partial (critical-tool)

Tool for create critical html partials

## Install

```sh
npm i bolighed-critical2partial -D
```

## Example

`critical.config.js`
```js
const path = require('path');

module.exports = config = {
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
    files: [{
        static_file: '../../../backend/home/templates-static/home/home.html',
        output_file: '../../../backend/home/templates/home/critical.home.html'
    }]
}
```
critical_options are the options of the `critical` npm module. 

`index.js`
```js
const config = require('./critical.config');
const c2p = require('bolighed-critical2partial')(config);
```