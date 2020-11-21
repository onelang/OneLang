// @python-import-all OneFile
// @php-use OneLang\File\OneFile
import { OneFile } from "One.File-v0.1";

// @python-import-all OneYaml
// @php-use OneLang\Yaml\OneYaml
import { OneYaml, YamlValue } from "One.Yaml-v0.1";

// @python-import-all OneJson
// @php-use OneLang\Json\OneJson
import { OneJObject, OneJson, OneJValue } from "One.Json-v0.1";

import { Reader } from "../Parsers/Common/Reader";
import { Expression, Identifier, PropertyAccessExpression } from "../One/Ast/Expressions";

import { Compiler } from "../One/Compiler";
import { IGenerator } from "./IGenerator";
import { ExpressionParser } from "../Parsers/Common/ExpressionParser";
import { TSOverviewGenerator } from "../Utils/TSOverviewGenerator";
import { JavaGenerator } from "./JavaGenerator";
import { CsharpGenerator } from "./CsharpGenerator";
import { PythonGenerator } from "./PythonGenerator";
import { PhpGenerator } from "./PhpGenerator";
import { CompilerHelper } from "../One/CompilerHelper";
import { ImplementationPackage } from "../StdLib/PackageManager";

export class ProjectTemplateMeta {
    constructor(
        public language: string,
        public destinationDir: string,
        public packageDir: string,
        public templateFiles: string[]) { }

    static fromYaml(obj: YamlValue) {
        return new ProjectTemplateMeta(
            obj.str("language"), 
            obj.str("destination-dir"),
            obj.str("package-dir"),
            obj.strArr("template-files"));
    }
}

export interface IVMValue { }

export class ObjectValue implements IVMValue {
    constructor(public props: { [name: string]: IVMValue }) { }
}

export class StringValue implements IVMValue {
    constructor(public value: string) { }
}

export class ArrayValue implements IVMValue {
    constructor(public items: IVMValue[]) { }
}

export interface ITemplateNode {
    format(model: ObjectValue): string;
}

export class TemplateBlock implements ITemplateNode {
    constructor(public items: ITemplateNode[]) { }

    format(model: ObjectValue): string { 
        return this.items.map(x => x.format(model)).join("");
    }
}

export class LiteralNode implements ITemplateNode {
    constructor(public value: string) { }

    format(model: ObjectValue): string { return this.value; }
}

export class ExprVM {
    constructor(public model: ObjectValue) { }

    static propAccess(obj: IVMValue, propName: string): IVMValue { 
        if (!(obj instanceof ObjectValue)) throw new Error("You can only access a property of an object!");
        if (!(propName in (<ObjectValue>obj).props)) throw new Error(`Property '${propName}' does not exists on this object!`);
        return (<ObjectValue>obj).props[propName];
    }

    evaluate(expr: Expression): IVMValue {
        if (expr instanceof Identifier) {
            return ExprVM.propAccess(this.model, expr.text);
        } else if (expr instanceof PropertyAccessExpression) {
            const objValue = this.evaluate(expr.object);
            return ExprVM.propAccess(objValue, expr.propertyName);
        } else 
            throw new Error("Unsupported expression!");
    }
}

export class ExpressionNode implements ITemplateNode {
    constructor(public expr: Expression) { }

    format(model: ObjectValue): string {
        const result = new ExprVM(model).evaluate(this.expr);
        if (result instanceof StringValue)
            return result.value;
        else
            throw new Error(`ExpressionNode (${TSOverviewGenerator.preview.expr(this.expr)}) return a non-string result!`);
    }
}

export class ForNode implements ITemplateNode {
    constructor(public variableName: string, public itemsExpr: Expression, public body: TemplateBlock) { }

    format(model: ObjectValue): string {
        const items = new ExprVM(model).evaluate(this.itemsExpr);
        if (!(items instanceof ArrayValue))
            throw new Error(`ForNode items (${TSOverviewGenerator.preview.expr(this.itemsExpr)}) return a non-array result!`);
        
        let result = "";
        for (const item of (<ArrayValue>items).items) {
            model.props[this.variableName] = item;
            result += this.body.format(model);
        }
        delete model.props[this.variableName];
        return result;
    }
}

export class TemplateParser {
    reader: Reader;
    exprParser: ExpressionParser;

    constructor(public template: string) {
        this.reader = new Reader(template);
        this.exprParser = new ExpressionParser(this.reader);
    }

    parseBlock(): TemplateBlock {
        const items: ITemplateNode[] = [];
        while (!this.reader.eof) {
            if (this.reader.peekToken("{{/")) break;
            if (this.reader.readToken("{{")) {
                if (this.reader.readToken("for")) {
                    const varName = this.reader.readIdentifier();
                    this.reader.expectToken("of");
                    const itemsExpr = this.exprParser.parse();
                    this.reader.expectToken("}}");
                    const body = this.parseBlock();
                    this.reader.expectToken("{{/for}}");
                    items.push(new ForNode(varName, itemsExpr, body));
                } else {
                    const expr = this.exprParser.parse();
                    items.push(new ExpressionNode(expr));
                    this.reader.expectToken("}}");
                }
            } else {
                let literal = this.reader.readUntil("{{", true);
                if (literal.endsWith("\\") && !literal.endsWith("\\\\"))
                    literal = literal.substring(0, literal.length - 1) + "{{";
                if (literal !== "")
                    items.push(new LiteralNode(literal));
            }
        }
        return new TemplateBlock(items);
    }

    parse(): TemplateBlock {
        return this.parseBlock();
    }
}

export class TemplateFile {
    main: TemplateBlock;

    constructor(public template: string) {
        this.main = new TemplateParser(template).parse();
    }

    format(model: ObjectValue): string {
        return this.main.format(model);
    }
}

export class ProjectTemplate {
    meta: ProjectTemplateMeta;
    srcFiles: string[];

    constructor(public templateDir: string) {
        this.meta = ProjectTemplateMeta.fromYaml(OneYaml.load(OneFile.readText(`${templateDir}/index.yaml`)));
        this.srcFiles = OneFile.listFiles(`${templateDir}/src`, true);
    }

    generate(dstDir: string, model: ObjectValue): void {
        for (const fn of this.srcFiles) {
            const srcFn = `${this.templateDir}/src/${fn}`;
            const dstFn = `${dstDir}/${fn}`;
            if (this.meta.templateFiles.includes(fn)) {
                const tmplFile = new TemplateFile(OneFile.readText(srcFn));
                const dstFile = tmplFile.format(model);
                OneFile.writeText(dstFn, dstFile);
            } else
                OneFile.copy(srcFn, dstFn);
        }
    }
}

export class ProjectDependency {
    constructor(public name: string, public version: string) { }
}

export class OneProjectFile {
    constructor(
        public name: string,
        public dependencies: ProjectDependency[],
        public sourceDir: string,
        public sourceLang: string,
        public nativeSourceDir: string,
        public outputDir: string,
        public projectTemplates: string[]) { }

    static fromJson(json: OneJObject): OneProjectFile {
        return new OneProjectFile(
            json.get("name").asString(),
            json.get("dependencies").getArrayItems().map(dep => dep.asObject()).map(
                dep => new ProjectDependency(dep.get("name").asString(), dep.get("version").asString())),
            json.get("sourceDir").asString(),
            json.get("sourceLang").asString(),
            json.get("nativeSourceDir").asString(),
            json.get("outputDir").asString(),
            json.get("projectTemplates").getArrayItems().map(x => x.asString()));
    }
}

export class ProjectGenerator {
    projectFile: OneProjectFile = null;
    srcDir: string;
    outDir: string;

    constructor(public baseDir: string, public projDir: string) {
        this.projectFile = OneProjectFile.fromJson(OneJson.parse(OneFile.readText(`${projDir}/one.json`)).asObject());
        this.srcDir = `${this.projDir}/${this.projectFile.sourceDir}`;
        this.outDir = `${this.projDir}/${this.projectFile.outputDir}`;
    }

    async generate() {
        const generators = [<IGenerator> new JavaGenerator(), <IGenerator> new CsharpGenerator(), <IGenerator> new PythonGenerator(), <IGenerator> new PhpGenerator()];
        for (const tmplName of this.projectFile.projectTemplates) {
            const compiler = await CompilerHelper.initProject(this.projectFile.name, this.srcDir, this.projectFile.sourceLang, null);
            compiler.processWorkspace();
    
            const projTemplate = new ProjectTemplate(`${this.baseDir}/project-templates/${tmplName}`);
            const langId = projTemplate.meta.language;
            const generator = generators.find(x => x.getLangName().toLowerCase() == langId);
            const langName = generator.getLangName();
    
            for (const trans of generator.getTransforms())
                trans.visitFiles(Object.values(compiler.projectPkg.files));
    
            // generate cross compiled source code
            const outDir = `${this.outDir}/${langName}`;
            console.log(`Generating ${langName} code...`);
            const files = generator.generate(compiler.projectPkg);
            for (const file of files)
                OneFile.writeText(`${outDir}/${projTemplate.meta.destinationDir||""}/${file.path}`, file.content);

            // copy implementation native sources
            const oneDeps: ImplementationPackage[] = [];
            const nativeDeps: { [name: string]: string } = {};
            for (const dep of this.projectFile.dependencies) {
                const impl = compiler.pacMan.implementationPkgs.find(x => x.content.id.name === dep.name);
                oneDeps.push(impl);
                const langData = impl.implementationYaml.languages[langId] || null;
                if (langData === null) continue;

                for (const natDep of langData.nativeDependencies || [])
                    nativeDeps[natDep.name] = natDep.version;

                if (langData.nativeSrcDir !== null) {
                    if (projTemplate.meta.packageDir === null) throw new Error("Package directory is empty in project template!");
                    const srcDir = langData.nativeSrcDir + (langData.nativeSrcDir.endsWith("/") ? "" : "/");
                    const dstDir = `${outDir}/${projTemplate.meta.packageDir}/${impl.content.id.name}`;
                    const depFiles = Object.keys(impl.content.files).filter(x => x.startsWith(srcDir)).map(x => x.substr(srcDir.length));
                    for (const fn of depFiles)
                        OneFile.writeText(`${dstDir}/${fn}`, impl.content.files[`${srcDir}${fn}`]);
                }
            }

            // generate files from project template
            const model = new ObjectValue({
                "dependencies": <IVMValue>new ArrayValue(Object.keys(nativeDeps).map(
                    name => new ObjectValue({ name: <IVMValue>new StringValue(name), version: <IVMValue>new StringValue(nativeDeps[name]) }))),
                "onepackages": <IVMValue>new ArrayValue(oneDeps.map(
                    dep => {
                        return new ObjectValue({ 
                            vendor: <IVMValue>new StringValue(dep.implementationYaml.vendor),
                            id: <IVMValue>new StringValue(dep.implementationYaml.name)
                        });
                    }))
            });
            projTemplate.generate(`${outDir}`, model);

            // copy native source codes from one project
            const nativeSrcDir = `${this.projDir}/${this.projectFile.nativeSourceDir}/${langName}`;
            for (const fn of OneFile.listFiles(nativeSrcDir, true))
                OneFile.copy(`${nativeSrcDir}/${fn}`, `${outDir}/${fn}`);
        }
    }
}