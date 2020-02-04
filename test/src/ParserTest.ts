import 'module-alias/register';
import * as fs from 'fs';
import * as path from 'path';
import { writeFile, readFile } from "@one/Utils/NodeUtils";
import { TypeScriptParser2 } from "@one/Parsers/TypeScriptParser2";
import { ExpressionParser } from "@one/Parsers/Common/ExpressionParser";
import { Reader } from "@one/Parsers/Common/Reader";

function glob(dir: string, result: string[] = []) {
    for (const entry of fs.readdirSync(dir).map(x => path.join(dir, x))) {
        const isDir = fs.statSync(entry).isDirectory();
        if (isDir)
            glob(entry, result);
        else
            result.push(entry);
    }
    return result;
}

function flatten(arr) { return [].concat(...arr); }

const files = flatten(["packages", "test/input", "langs"].map(x => glob(x))).filter(x => x.endsWith(".ts") && !x.includes("/native/"));
for (const file of files) {
    console.log(`parsing ${file}...`);
    TypeScriptParser2.parseFile(readFile(file));
}
