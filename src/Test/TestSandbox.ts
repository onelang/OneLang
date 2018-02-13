import { OneCompiler } from "../OneCompiler";
import { readFile, writeFile } from "../Utils/NodeUtils";
require("../Utils/Extensions.js");
global["YAML"] = require('yamljs'); 

const programCode = `
<?php

class Calculator {
    // @signature factor(n: number): number
    function factor($n) {
        if ($n <= 1) {
            return 3;
        } else {
            return $this->factor($n - 1) * $n;
        }
    }
    
    // @signature calc(): number
    function calc() {
        return 5;
    }
}

print("Hello!" . "\n");
`.trim();

const compiler = new OneCompiler();
compiler.saveSchemaStateCallback = (type: "overviewText"|"schemaJson", schemaType: "program"|"overlay"|"stdlib", name: string, data: string) => {
    if (type === "schemaJson" && schemaType === "program" && name === "0_Original")
        writeFile("tmp/debug.json", data);
};
const overlayCode = readFile(`langs/NativeResolvers/php.ts`);
const stdlibCode = readFile(`langs/StdLibs/stdlib.d.ts`);
const genericTransforms = readFile(`langs/NativeResolvers/GenericTransforms.yaml`);
const tsYaml = readFile(`langs/typescript.yaml`);
const phpYaml = readFile(`langs/php.yaml`);
const csharpYaml = readFile(`langs/csharp.yaml`);

compiler.parse("php", programCode, overlayCode, stdlibCode, genericTransforms);
const result = compiler.compile(csharpYaml, "csharp", true);
console.log(result);
