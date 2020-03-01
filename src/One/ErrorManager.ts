export class CompilationError {
    constructor(public msg: string, public source: string = null) { }
}

export class ErrorManager {
    errors: CompilationError[] = [];

    throw(msg: string, source: string = null) {
        console.error((source ? `[${source}] ` : "") + msg);
        this.errors.push(new CompilationError(msg, source));
        return null;
    }
}