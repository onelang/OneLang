import { SourceFile, IInterface, IMethodBase, Method } from "./Ast/Types";
import { AstTransformer } from "./AstTransformer";
import { Statement } from "./Ast/Statements";
import { TSOverviewGenerator } from "../Utils/TSOverviewGenerator";

export class CompilationError {
    constructor(public msg: string, public isWarning: boolean, public transformerName: string, public file: SourceFile, public cls: IInterface, public method: IMethodBase, public stmt: Statement) { }
}

export class ErrorManager {
    transformer: AstTransformer = null;
    errors: CompilationError[] = [];

    resetContext(transformer: AstTransformer = null): void {
        this.transformer = transformer;
    }

    log(msg: string, isWarning: boolean) {
        const t = this.transformer;
        console.error((isWarning ? "[WARNING] " : "") + 
            (t ? `[${t.name}] ` : "") + 
            (t && t.currentFile ? `${t.currentFile.sourcePath}${t.currentInterface ? ` -> ${t.currentInterface.name}${t.currentMethod instanceof Method ? `::${t.currentMethod.name}` : ""}` : ""}: ` : "") + 
            msg + 
            (t && t.currentStatement !== null ? `\n  -> here: ${TSOverviewGenerator.stmt(t.currentStatement)}` : ""));
        this.errors.push(new CompilationError(msg, isWarning, t && t.name, t && t.currentFile, t && t.currentInterface, t && t.currentMethod, t && t.currentStatement));
    }

    throw(msg: string): void {
        this.log(msg, false);
    }

    warn(msg: string): void {
        this.log(msg, true);
    }
}