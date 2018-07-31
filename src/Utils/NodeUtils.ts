
export function readFile(fn: string): string {
    const fs = require("fs");
    return fs.readFileSync(fn, "utf8");
}

export function writeFile(fn: string, data: any) {
    const fs = require("fs");
    const mkdirp = require('mkdirp');
    const path = require('path');

    mkdirp.sync(path.dirname(fn));
    fs.writeFileSync(fn, data);
}

export function jsonRequest<T>(url: string, body: any): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const request = require('request');
        request({ url, method: "POST", json: true, headers: { 'Origin': 'http://127.0.0.1:80' }, body }, function(error, response, body: T) {
            if (error)
                reject(error);
            else
                resolve(body);
        });
    });
}

const process = require("process");
export function timeNow() {
    const time = process.hrtime();
    return time[0] * 1000 + Math.round(time[1] / 1000 / 1000);
}