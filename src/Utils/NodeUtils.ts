import fs = require("fs");
import mkdirp = require('mkdirp');
import path = require('path');

export function readFile(fn: string) {
    return fs.readFileSync(fn, "utf8");
}

export function writeFile(fn: string, data: any) {
    mkdirp.sync(path.dirname(fn));
    fs.writeFileSync(fn, data);
}
