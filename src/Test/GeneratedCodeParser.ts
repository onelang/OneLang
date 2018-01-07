import { TypeScriptParser2 } from "../Parsers/TypeScriptParser2";
import { CSharpParser } from "../Parsers/CSharpParser";
import { readFile, writeFile } from "../Utils/NodeUtils";

const glob = require("glob");
let parsers = ["ts", "cs"];
parsers = ["cs"];

if (parsers.includes("ts")) {
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
}

if (parsers.includes("cs")) {
    for (const fn of <string[]>glob.sync("generated/**/*.cs")) {
        //if (!fn.includes("ReflectionTest")) continue;
        console.log(`Parsing file '${fn}'...`);
        let content = readFile(fn);
        content = content.split("\npublic class Program")[0]; // TODO: less hacky way of removing test code?
        CSharpParser.parseFile(content);
        // TODO: check that AST should stay the same
    }
}
