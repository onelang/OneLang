// @python-import OneFile
import { OneFile } from "One.File-v0.1";
import { IGenerator } from "../Generator/IGenerator";
import { Compiler } from "../One/Compiler";

export class SelfTestRunner {
    constructor(public baseDir: string) { }

    public async runTest(generator: IGenerator): Promise<void> {
        console.log("[-] SelfTestRunner :: START");
        const compiler = new Compiler();
        await compiler.init(`${this.baseDir}packages/`);
        compiler.setupNativeResolver(OneFile.readText(`${this.baseDir}langs/NativeResolvers/typescript.ts`));
        compiler.newWorkspace();

        const projDir = `${this.baseDir}src/`;
        for (const file of OneFile.listFiles(projDir, true).filter(x => x.endsWith(".ts")))
            compiler.addProjectFile(file, OneFile.readText(`${projDir}/${file}`));

        compiler.processWorkspace();
        const generated = generator.generate(compiler.projectPkg);
        
        const langName = generator.getLangName();
        const ext = `.${generator.getExtension()}`;

        let allMatch = true;
        for (const genFile of generated) {
            const fn = genFile.path.replace(/\.ts$/, ext);
            const projBase = `${this.baseDir}test/artifacts/ProjectTest/OneLang`;
            const tsGenPath = `${projBase}/${langName}/${fn}`;
            const reGenPath = `${projBase}/${langName}_Regen_${langName}/${fn}`;
            const tsGenContent = OneFile.readText(tsGenPath);
            const reGenContent = genFile.content;

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