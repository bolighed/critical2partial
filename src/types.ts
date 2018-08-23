
export interface Critical {
    inline?: boolean
    // Your base directory
    base?: string;
    // HTML source
    html?: string;
    // HTML source file
    src: string;
    // Your CSS Files (optional)
    css?: Array<string>;
    // Viewport width
    width?: number;
    // Viewport height
    height?: number;
    // Target for final HTML output.
    // use some CSS file when the inline option is not set
    dest?: string;
    // Minify critical-path CSS when inlining
    minify?: boolean;
    // Extract inlined styles from referenced stylesheets
    extract?: boolean;
    // Complete Timeout for Operation
    timeout?: number;
    // Prefix for asset directory
    pathPrefix?: string;
    // ignore CSS rules
    ignore?: Array<string | RegExp>;
    // overwrite default options
    ignoreOptions?: any;
}


export interface FileConfig {
    critical: Critical;
    url: string;
    dest: string;
    delay?: number
}