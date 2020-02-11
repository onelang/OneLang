import 'module-alias/register';
import * as assert from 'assert';
import * as YAML from "js-yaml";
import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import * as crypto from 'crypto';

export { assert };

const baseDir = `${__dirname}/../../`;

export function readFile(fn: string): string {
    return fs.readFileSync(`${baseDir}${fn}`, "utf8");
}

export function writeFile(fn: string, data: any) {
    mkdirp.sync(path.dirname(fn));
    fs.writeFileSync(`${baseDir}${fn}`, data);
}

export function deleteFile(fn: string) {
    fs.unlinkSync(`${baseDir}${fn}`);
}

export function exists(fn: string) {
    return fs.existsSync(`${baseDir}${fn}`);
}

export function getYamlTestSuite(name: string){ 
    return YAML.safeLoad(readFile(`test/testSuites/${name}.yaml`));
}

export function runYamlTestSuite(name: string, caseRunner: (key: string, value: any) => void) {
    const cases = getYamlTestSuite(name);
    for (const key of Object.keys(cases))
        it(key, () => caseRunner(key, cases[key]));
}

export function glob(dir: string, result: string[] = []) {
    for (const entry of fs.readdirSync(`${baseDir}${dir}`).map(x => path.join(dir, x))) {
        const isDir = fs.statSync(`${baseDir}${entry}`).isDirectory();
        if (isDir)
            glob(entry, result);
        else
            result.push(entry);
    }
    return result;
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

export function timeNow() {
    const process = require("process");
    const time = process.hrtime();
    return time[0] * 1000 + Math.round(time[1] / 1000 / 1000);
}