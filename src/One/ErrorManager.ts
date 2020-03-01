import { SourceFile } from "./Ast/Types";

export class CompilationError {
    constructor(public msg: string, public transformer: string = null, public file: SourceFile = null) { }
}

export class ErrorManager {
    transformer: string = null;
    file: SourceFile = null;
    errors: CompilationError[] = [];

    resetContext(transformer: string = null, file: SourceFile = null) {
        this.transformer = transformer;
        this.file = file;
    }

    throw(msg: string) {
        console.error((this.transformer ? `[${this.transformer}] ` : "") + (this.file ? `${this.file.sourcePath}: ` : "") + msg);
        this.errors.push(new CompilationError(msg, this.transformer, this.file));
        return null;
    }
}