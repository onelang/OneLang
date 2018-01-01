require("../Utils/Extensions.js");
import { writeFile, readFile } from "../Utils/NodeUtils";
import { TypeScriptParser2 } from "../Parsers/TypeScriptParser2";

const sourceCode = readFile("input/Test.ts");
const parser = new TypeScriptParser2(sourceCode);
const result = parser.parse();
console.log(result);