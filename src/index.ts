import { PackageManager, PackageSource } from "./StdLib/PackageManager";
import { OneCompiler } from "./OneCompiler";
import { ExprLangLexer } from "./Generator/ExprLang/ExprLangLexer";
import { ExprLangParser } from "./Generator/ExprLang/ExprLangParser";
import { ExprLangAst } from "./Generator/ExprLang/ExprLangAst";
import { ExprLangAstPrinter } from "./Generator/ExprLang/ExprLangAstPrinter";
import { ExprLangVM, VariableContext, VariableSource } from "./Generator/ExprLang/ExprLangVM";
import { AstHelper } from "./One/AstHelper";
import { OverviewGenerator } from "./One/OverviewGenerator";
import { PackageBundleSource } from "./StdLib/PackageBundleSource";
import { PackagesFolderSource } from "./StdLib/PackagesFolderSource";
import * as YAML from "js-yaml";
import { LangFileSchema } from "./Generator/LangFileSchema";

function isNode() { return typeof process !== 'undefined' && process.versions != null && process.versions.node != null; }

async function readFile(filename: string) {
    if (isNode()) {
        const fs = require("fs");
        return fs.readFileSync(`${__dirname}/../${filename}`, "utf8");
    } else {
        const dirName = (<any>require).toUrl("./");
        const url = `${dirName}../${filename}`;
        const resp = await fetch(url);
        const respText = await resp.text();
        return respText;
    }
}

async function getPackageSource(): Promise<PackageSource> {
    if (isNode()) {
        return new PackagesFolderSource(`${__dirname}/../packages`);
    } else {
        return new PackageBundleSource(JSON.parse(await readFile("packages/bundle.json")));
    }
}

class OneLangGlobal {
    getCapabilities() { 
        return { 
            sourceLanguages: ['typescript', 'php', 'ruby', 'csharp' ],
            targetLanguages: ['cpp', 'csharp', 'go', 'java', 'javascript', 'perl', 'php', 'python', 'ruby',' swift', 'typescript' ],
        }; 
    }

    async transpile(source: string, sourceLang: string, targetLang: string): Promise<string> {
        const pacMan = new PackageManager(await getPackageSource());
        await pacMan.loadAllCached();

        const overlayCode = await readFile(`langs/NativeResolvers/${sourceLang}.ts`);
        const stdlibCode = pacMan.getInterfaceDefinitions();
        const genericTransforms = await readFile(`langs/NativeResolvers/GenericTransforms.yaml`);

        const compiler = new OneCompiler();
        compiler.setup(overlayCode, stdlibCode, genericTransforms);
        compiler.parse(sourceLang, source);

        const langSchema = <LangFileSchema.LangFile> YAML.safeLoad(await readFile(`langs/${targetLang}.yaml`));
        OneCompiler.setupLangSchema(langSchema, pacMan, compiler.stdlibCtx.schema);

        const codeGen = compiler.getCodeGenerator(langSchema);
        const generatedCode = codeGen.generate(false);
        return generatedCode;
    }
}

export const OneLang = new OneLangGlobal();
export { ExprLangLexer, ExprLangParser, ExprLangAst, ExprLangAstPrinter, ExprLangVM, VariableContext, VariableSource, OneCompiler, AstHelper, OverviewGenerator, PackageManager, PackagesFolderSource, PackageBundleSource };
