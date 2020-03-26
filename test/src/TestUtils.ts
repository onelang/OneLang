import 'module-alias/register';
import * as assert from 'assert';
import * as YAML from "js-yaml";
import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';

export { assert };

export const baseDir = `${__dirname}/../..`;

export function readFile(fn: string): string {
    return fs.readFileSync(`${baseDir}/${fn}`, "utf8");
}

export function writeFile(fn: string, data: any) {
    const fullFn = `${baseDir}/${fn}`;
    mkdirp.sync(path.dirname(fullFn));
    fs.writeFileSync(fullFn, data);
}

export function deleteFile(fn: string) {
    fs.unlinkSync(`${baseDir}/${fn}`);
}

export function exists(fn: string) {
    return fs.existsSync(`${baseDir}/${fn}`);
}

export function readDir(path: string) {
    return fs.readdirSync(`${baseDir}/${path}`);
}

export function getCompilationTestPrgNames() {
    return readDir("test/testSuites/CompilationTest").map(x => x.replace(".ts", ""));
}

export function getLangNames() {
    return readDir("langs").filter(x => x.endsWith(".yaml")).map(x => x.replace(".yaml", ""));
}

export function getYamlTestSuite(name: string){ 
    return YAML.safeLoad(readFile(`test/testSuites/${name}.yaml`));
}

export function runYamlTestSuite(name: string, caseRunner: (key: string, value: any) => void) {
    const cases = getYamlTestSuite(name);
    for (const key of Object.keys(cases))
        it(key, () => caseRunner(key, cases[key]));
}

export function glob(dir: string, result: string[] = [], path = '') {
    const fullPath = `${baseDir}/${dir}/${path}`;
    for (const entry of fs.readdirSync(fullPath)) {
        const isDir = fs.statSync(`${fullPath}/${entry}`).isDirectory();
        if (isDir)
            glob(dir, result, `${path}${entry}/`);
        else
            result.push(`${path}${entry}`);
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
