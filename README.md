#critical2partial (critical-tool)

Tool for create critical html partials

## Install

```sh
npm i critical2partial -D
```

## Example

critical.config.js
```js
module.exports = config = {
    critical_path: '../../backend',
    critical_assets_folder: 'assets',
    files: [{
        static_file: '../../backend/home/templates-static/home/home.html',
        output_file: '../../backend/home/templates/home/critical.home.html'
    }]
}
```

index.js
```js
const config = require('./critical.config');
const c2p = require('critical2partial')(config);
```