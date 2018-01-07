import { TypeScriptParser2 } from "../Parsers/TypeScriptParser2";
import { readFile, writeFile } from "../Utils/NodeUtils";

const glob = require("glob");

for (const fn of <string[]>glob.sync("generated/**/*.ts")) {
    //if (!fn.includes("ReflectionTest")) continue;
    console.log(`Parsing file '${fn}'...`);
    let content = readFile(fn);
    content = content.split("\ntry {")[0]; // TODO: less hacky way of removing test code?
    content = content.replace(/one.Reflect.setupClass(.|\n)*?\n  \]\)\);\n/gm, "");
    content = content.replace(/const (\w+) = require\('\1'\);\n/gm, "");

    TypeScriptParser2.parseFile(content);
    // TODO: check that AST should stay the same
}
