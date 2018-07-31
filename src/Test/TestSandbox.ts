import { OneCompiler } from "../OneCompiler";
import { readFile, writeFile } from "../Utils/NodeUtils";
require("../Utils/Extensions.js");
global["YAML"] = require('yamljs'); 

const programCode = `
<?php

class Calculator {
    // @signature calc(n: number): number
    function calc($n, $i) {
        if ($n <= 1) {
            return 1;
        } else {
            return $this->calc($n - 1, $i) * $n - $i;
        }
    }
}

$calc = new Calculator();
print("result = " . $calc->calc(10, 5) . "\n");
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
const rubyYaml = readFile(`langs/ruby.yaml`);

compiler.setup(overlayCode, stdlibCode, genericTransforms);
compiler.parse("php", programCode);
// TODO: pacMan is null
const result = compiler.compile(rubyYaml, null, true);
console.log(result);
