// @python-import-all OneFile
// @php-use OneLang\File\OneFile
import { OneFile } from "One.File-v0.1";
import { Compiler } from "./Compiler";

export class CompilerHelper {
    static baseDir: string = "./";

    static async initProject(projectName: string, sourceDir: string, lang: string = "ts", packagesDir: string = null): Promise<Compiler> {
        if (lang !== "ts") throw new Error("Only typescript is supported.");
        
        const compiler = new Compiler();
        await compiler.init(packagesDir || `${this.baseDir}packages/`);
        compiler.setupNativeResolver(OneFile.readText(`${this.baseDir}langs/NativeResolvers/typescript.ts`));
        compiler.newWorkspace(projectName);

        for (const file of OneFile.listFiles(sourceDir, true).filter(x => x.endsWith(".ts")))
            compiler.addProjectFile(file, OneFile.readText(`${sourceDir}/${file}`));

        return compiler;
    }
}