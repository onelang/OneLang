require("./Utils/Extensions.js");
global["YAML"] = require('yamljs'); 
const fs = require("fs");
import { writeFile, readFile } from "./Utils/NodeUtils";
import { OneCompiler } from "./OneCompiler";

const prgName = "Test";

const compiler = new OneCompiler();
compiler.saveSchemaStateCallback = (type: "overviewText"|"schemaJson", schemaType: "program"|"overlay", name: string, data: string) => {
    writeFile(`tmp/${schemaType === "program" ? prgName : "tsToOne"}_${name}.${type === "overviewText" ? "txt" : "json"}`, data); 
};

const programCode = readFile(`input/${prgName}.ts`);
const overlayCode = readFile(`langs/NativeResolvers/typescript.ts`);
compiler.parseFromTS(programCode, overlayCode);

const langNames = fs.readdirSync("langs").filter(x => x.endsWith(".yaml")).map(x => x.replace(".yaml", ""));
//const langNames = ["cpp", "csharp", "go", "java", "javascript", "perl", "php", "python", "ruby", "swift", "typescript"];
for (const langName of langNames) {
    const langYaml = readFile(`langs/${langName}.yaml`);
    const codeGen = compiler.getCodeGenerator(langYaml, langName);
    codeGen.generate(true);

    writeFile(`tmp/${prgName}.${codeGen.lang.extension}`, codeGen.generatedCode);
    writeFile(`tmp/TemplateGenerators_${langName}.js`, codeGen.templateObjectCode);
}
