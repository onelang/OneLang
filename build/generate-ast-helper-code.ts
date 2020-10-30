import 'module-alias/register';
import { TypeScriptParser2 } from "@one/Parsers/TypeScriptParser2";
import { readFileSync, writeFileSync } from "fs";
import { UnresolvedType } from '@one/One/Ast/AstTypes';
import { Package, SourcePath } from '@one/One/Ast/Types';

const baseDir = `${__dirname}/../src`;
function pad(str: string): string { return str.split(/\n/g).map(x => `    ${x}`).join('\n'); }

function conv(type: UnresolvedType, expr: string) {
    if (["TsString", "TsBoolean", "Visibility", "UnaryType"].includes(type.typeName)) {
        return expr;
    } else if (type.typeName === "TsArray") {
        return `${expr}.map(x => ${conv(<UnresolvedType>type.typeArguments[0], "x")})`;
    } else {
        return `${expr}.clone()`;
    }
}

const filesToParse = ["Types", "AstTypes", "Expressions", "Statements", "References"];
for (const fn of filesToParse) {
    const fullFn = `${baseDir}/One/Ast/${fn}.ts`;
    let fileContent = readFileSync(fullFn, 'utf-8');
    const file = TypeScriptParser2.parseFile(fileContent, new SourcePath(new Package("@", false), fn));
    for (const cls of file.classes) {
        fileContent = fileContent.replace(new RegExp(`(\nexport class ${cls.name} )(.*?)\n}`, "s"), (arg0, head, body) => {
            body = body.replace(/\n\n    \/\/ @auto-generated\n    clone\([^\n]*\}/gs, "");

            const mps = cls.constructor_ === null ? [] : cls.constructor_.parameters;
            if (mps.filter(x => x.fieldDecl === null).length > 0)
                throw new Error("Non-public field found!");

            const newExpr = `new ${cls.name}(${mps.map(mp => conv(<UnresolvedType>mp.type, `this.${mp.name}`)).join(", ")})`;
            const noBody = ["Expression"].includes(cls.name) || mps.length === 0;
            const cloneBody = noBody ? "" : "\n\n" + pad(`// @auto-generated\nclone() { return ${newExpr}; }`);

            return `${head}${body}${cloneBody}\n}`;
        });
    }
    writeFileSync(fullFn, fileContent);
}