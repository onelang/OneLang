import 'module-alias/register';
import { TypeScriptParser2 } from "@one/Parsers/TypeScriptParser2";
import { readFileSync, writeFileSync } from "fs";
import { UnresolvedType } from '@one/One/Ast/AstTypes';
import { Package, SourcePath } from '@one/One/Ast/Types';

function pad(str: string): string { return str.split(/\n/g).map(x => `    ${x}`).join('\n'); }

const baseDir = `${__dirname}/../src`;

const filesToParse = ["Types", "AstTypes", "Expressions", "Statements"];
const files = filesToParse.map(fn => TypeScriptParser2.parseFile(readFileSync(`${baseDir}/One/Ast/${fn}.ts`, 'utf-8'), new SourcePath(new Package("@", false), fn)));
const classes = files.map(x => x.classes).flat();
const classNames = classes.map(x => x.name);

function conv(type: UnresolvedType, expr: string) {
    if (["TsString", "TsBoolean", "Visibility"].includes(type.typeName)) {
        return expr;
    } else if (type.typeName === "TsArray") {
        return `${expr}.map(x => ${conv(<UnresolvedType>type.typeArguments[0], "x")})`;
    } else if (type.typeName.endsWith("Type")) {
        return `this.cloneType(${expr})`;
    } else if (classNames.includes(type.typeName) || ["IImportable"].includes(type.typeName)) {
        return `this.cloneNode(${expr})`;
    } else {
        debugger;
        return expr;
    }
}

const methodBody = classes.filter(x => x.name !== "Expression").map(cls => {
    const mps = cls.constructor_ === null ? [] : cls.constructor_.parameters;
    if (mps.filter(x => x.fieldDecl === null).length > 0)
        throw new Error("Non-public field found!");
    return "" + 
        `if (node instanceof ${cls.name}) {\n` + pad(
            `return new ${cls.name}(${
                mps.map(mp => conv(<UnresolvedType>mp.type, `node.${mp.name}`)).join(", ")}` + 
            `);`) + "\n" +
        `}`;
}).join(" else ");

const imports = files.map(f => `import { ${f.classes.map(cls => cls.name).join(", ")} } from "./Ast/${f.sourcePath.path}";`);

//const genCode = `${imports.join("\n")}\n\nexport class AstCloner {\n${pad(`cloneNode(node: IAstNode) {\n${pad(methodBody)}\n}`)}\n}`;
//console.log(genCode);

const destFn = `${baseDir}/One/AstCloner.ts`;
const currContent = readFileSync(destFn, 'utf-8');
const newContent = currContent
    .replace(/(#region Generated_Imports\n).*?(\n[/]+#endregion)/, `\1${imports.join("\n")}\2`)
    .replace(/(\n    cloneNode[^\n]+).*?(\n    \})/, `\1${pad(pad(methodBody))}\2`);
writeFileSync(destFn, newContent);
debugger;