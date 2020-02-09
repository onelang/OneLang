import 'module-alias/register';
import * as assert from 'assert';
import * as YAML from "js-yaml";
import * as fs from 'fs';
import * as path from 'path';

export function readFile(fn: string): string {
    const fs = require("fs");
    return fs.readFileSync(fn, "utf8");
}

export function getYamlTestSuite(name: string){ 
    return YAML.safeLoad(readFile(`${__dirname}/../testSuites/${name}.yaml`));
}

export function runYamlTestSuite(name: string, caseRunner: (key: string, value: any) => void) {
    const cases = getYamlTestSuite(name);
    for (const key of Object.keys(cases))
        it(key, () => caseRunner(key, cases[key]));
}

export function glob(dir: string, result: string[] = []) {
    for (const entry of fs.readdirSync(dir).map(x => path.join(dir, x))) {
        const isDir = fs.statSync(entry).isDirectory();
        if (isDir)
            glob(entry, result);
        else
            result.push(entry);
    }
    return result;
}

export { assert };