import { OneFile } from "One.File-v0.1";
import { IGenerator } from "../Generator/IGenerator";
import { Compiler } from "../One/Compiler";

export class SelfTestRunner {
    constructor(public baseDir: string) { }

    public async runTest(generator: IGenerator): Promise<void> {
        console.log("[-] SelfTestRunner :: START");
        var compiler = new Compiler();
        await compiler.init(`${this.baseDir}packages/`);
        compiler.setupNativeResolver(OneFile.readText(`${this.baseDir}langs/NativeResolvers/typescript.ts`));
        compiler.newWorkspace();

        var projDir = `${this.baseDir}src/`;
        for (const file of OneFile.listFiles(projDir, true).filter(x => x.endsWith(".ts")))
            compiler.addProjectFile(file, OneFile.readText(`${projDir}/${file}`));

        compiler.processWorkspace();
        var generated = generator.generate(compiler.projectPkg);
        
        var langName = generator.getLangName();
        var ext = `.${generator.getExtension()}`;

        var allMatch = true;
        for (const genFile of generated) {
            var tsGenPath = `${this.baseDir}test/artifacts/ProjectTest/OneLang/${langName}/${genFile.path.replace(/\.ts$/, ext)}`;
            var reGenPath = `${this.baseDir}test/artifacts/ProjectTest/OneLang/${langName}_Regen_${langName}/${genFile.path.replace(/\.ts$/, ext)}`;
            var tsGenContent = OneFile.readText(tsGenPath);
            var reGenContent = genFile.content;

            OneFile.writeText(reGenPath, genFile.content);
            
            if (tsGenContent != reGenContent) {
                console.error(`Content does not match: ${genFile.path}`);
                allMatch = false;
            }
        }

        console.log(allMatch ? "[+} SUCCESS! All generated files are the same" : "[!] FAIL! Not all files are the same");
        console.log("[-] SelfTestRunner :: DONE");
    }
}