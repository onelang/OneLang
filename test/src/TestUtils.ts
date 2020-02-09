import 'module-alias/register';
import * as assert from 'assert';
import * as YAML from "js-yaml";
import { readFile } from "@one/Utils/NodeUtils";

export function getYamlTestSuite(name: string){ 
    return YAML.safeLoad(readFile(`${__dirname}/../testSuites/${name}.yaml`));
}

export function runYamlTestSuite(name: string, caseRunner: (key: string, value: any) => void) {
    const cases = getYamlTestSuite(name);
    for (const key of Object.keys(cases))
        it(key, () => caseRunner(key, cases[key]));
}

export { assert };