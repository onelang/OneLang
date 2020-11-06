import 'module-alias/register';
import { TypeScriptParser2 } from "@one/Parsers/TypeScriptParser2";
import { readFileSync, writeFileSync } from "fs";
import { UnresolvedType } from '@one/One/Ast/AstTypes';
import { Package, SourcePath } from '@one/One/Ast/Types';

const baseDir = `${__dirname}/../src`;
function pad(str: string): string { return str.split(/\n/g).map(x => `    ${x}`).join('\n'); }
function body(str: string): string { return str.includes("\n") ? `{\n${pad(str)}\n}` : `{ ${str} }`; }

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
        fileContent = fileContent.replace(new RegExp(`(\nexport class ${cls.name} )(.*?)\n}`, "s"), (arg0, head, clsBody) => {
            clsBody = clsBody.replace(/\n\n    \/\/ #region @auto-generated generate-ast-helper-code.*?\/\/ #endregion/gs, "");

            const mps = cls.constructor_ === null ? [] : cls.constructor_.parameters;
            if (mps.filter(x => x.fieldDecl === null).length > 0)
                throw new Error("Non-public field found!");

            let cloneMethod = "";
            if (!["Expression"].includes(cls.name) && mps.length !== 0) {
                const newExpr = `new ${cls.name}(${mps.map(mp => conv(<UnresolvedType>mp.type, `this.${mp.name}`)).join(", ")})`;
                let cloneBody = `return ${newExpr};`;
                const baseCls = cls.baseClass === null ? null : (<UnresolvedType>cls.baseClass).typeName;
                if (baseCls === "Statement" || baseCls === "Expression") {
                    const fieldsToCopy = cls.fields.filter(f => f.constructorParam === null);
                    const fieldClonerCode = fieldsToCopy.map(f => `result.${f.name} = ${conv(<UnresolvedType>f.type, `this.${f.name}`)};\n`).join('');
                    cloneBody = `const result = ${newExpr};\n${fieldClonerCode}this.cloneTo(result);\nreturn result;`;
                }
                cloneMethod = "\n\n" + pad(`// #region @auto-generated generate-ast-helper-code\nclone() ${body(cloneBody)}\n// #endregion`);
            }

            return `${head}${clsBody}${cloneMethod}\n}`;
        });
    }
    writeFileSync(fullFn, fileContent);
}