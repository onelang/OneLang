// @python-import-all onelang_file
// @php-use OneLang\File\OneFile
import { OneFile } from "One.File-v0.1";

// @python-import-all onelang_yaml
// @php-use OneLang\Yaml\OneYaml
import { OneYaml, YamlValue } from "One.Yaml-v0.1";

// @python-import-all onelang_json
// @php-use OneLang\Json\OneJson
import { OneJObject, OneJson } from "One.Json-v0.1";

import { IGenerator } from "./IGenerator";
import { JavaGenerator } from "./JavaGenerator";
import { CsharpGenerator } from "./CsharpGenerator";
import { PythonGenerator } from "./PythonGenerator";
import { PhpGenerator } from "./PhpGenerator";
import { CompilerHelper } from "../One/CompilerHelper";
import { ImplementationPackage } from "../StdLib/PackageManager";
import { ArrayValue, IVMValue, ObjectValue, StringValue } from "../VM/Values";
import { TemplateParser } from "../Template/TemplateParser";
import { TemplateFileGeneratorPlugin } from "./TemplateFileGeneratorPlugin";
import { VMContext } from "../VM/ExprVM";

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
                const tmpl = new TemplateParser(OneFile.readText(srcFn)).parse();
                const dstFile = tmpl.format(new VMContext(model));
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

    async generate(): Promise<void> {
        // copy native source codes from one project
        const nativeSrcDir = `${this.projDir}/${this.projectFile.nativeSourceDir}`;
        for (const fn of OneFile.listFiles(nativeSrcDir, true))
            OneFile.copy(`${nativeSrcDir}/${fn}`, `${this.outDir}/${fn}`);

        const generators = [<IGenerator> new JavaGenerator(), <IGenerator> new CsharpGenerator(), <IGenerator> new PythonGenerator(), <IGenerator> new PhpGenerator()];
        for (const tmplName of this.projectFile.projectTemplates) {
            const compiler = await CompilerHelper.initProject(this.projectFile.name, this.srcDir, this.projectFile.sourceLang, null);
            compiler.processWorkspace();
    
            const projTemplate = new ProjectTemplate(`${this.baseDir}/project-templates/${tmplName}`);
            const langId = projTemplate.meta.language;
            const generator = generators.find(x => x.getLangName().toLowerCase() == langId);
            const langName = generator.getLangName();
            const outDir = `${this.outDir}/${langName}`;
    
            for (const trans of generator.getTransforms())
                trans.visitFiles(Object.values(compiler.projectPkg.files));
    
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
                    const dstDir = `${outDir}/${projTemplate.meta.packageDir}/${langData.packageDir || impl.content.id.name}`;
                    const depFiles = Object.keys(impl.content.files).filter(x => x.startsWith(srcDir)).map(x => x.substr(srcDir.length));
                    for (const fn of depFiles)
                        OneFile.writeText(`${dstDir}/${fn}`, impl.content.files[`${srcDir}${fn}`]);
                }

                if (langData.generatorPlugins !== null)
                    for (const genPlugFn of langData.generatorPlugins)
                        generator.addPlugin(new TemplateFileGeneratorPlugin(generator, impl.content.files[genPlugFn]));
            }

            // generate cross compiled source code
            console.log(`Generating ${langName} code...`);
            const files = generator.generate(compiler.projectPkg);
            for (const file of files)
                OneFile.writeText(`${outDir}/${projTemplate.meta.destinationDir||""}/${file.path}`, file.content);

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
        }
    }
}