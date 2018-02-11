import { OneCompiler } from "../OneCompiler";
import { readFile, writeFile } from "../Utils/NodeUtils";
require("../Utils/Extensions.js");
global["YAML"] = require('yamljs'); 

const programCode = `
class Calculator 
  def calc()
      return 4
  end
end

puts "Hello!"

calc = Calculator.new()
puts "n = #{calc.calc()}"`.trim();

const compiler = new OneCompiler();
compiler.saveSchemaStateCallback = (type: "overviewText"|"schemaJson", schemaType: "program"|"overlay"|"stdlib", name: string, data: string) => {
    if (type === "schemaJson" && schemaType === "program" && name === "0_Original")
        writeFile("tmp/debug.json", data);
};
const overlayCode = readFile(`langs/NativeResolvers/ruby.ts`);
const stdlibCode = readFile(`langs/StdLibs/stdlib.d.ts`);
const genericTransforms = readFile(`langs/NativeResolvers/GenericTransforms.yaml`);
const tsYaml = readFile(`langs/typescript.yaml`);
const phpYaml = readFile(`langs/php.yaml`);

compiler.parse("ruby", programCode, overlayCode, stdlibCode, genericTransforms);
const result = compiler.compile(phpYaml, "php", true);
console.log(result);
