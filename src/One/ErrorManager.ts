import { SourceFile, IInterface, IMethodBase, Method, IAstNode, Field, Property, Constructor } from "./Ast/Types";
import { AstTransformer } from "./AstTransformer";
import { Statement } from "./Ast/Statements";
import { TSOverviewGenerator } from "../Utils/TSOverviewGenerator";
import { Expression } from "./Ast/Expressions";

export class CompilationError {
    constructor(
        public msg: string,
        public isWarning: boolean,
        public transformerName: string, 
        public node: IAstNode) { }
}

export enum LogType { Info, Warning, Error }

export class ErrorManager {
    transformer: AstTransformer = null;
    currentNode: IAstNode = null;
    errors: CompilationError[] = [];
    lastContextInfo: string;

    get location() {
        const t = this.transformer;
        
        let par = this.currentNode;
        while (par instanceof Expression)
            par = par.parentNode;

        let location: string = null;
        if (par instanceof Field)
            location = `${par.parentInterface.parentFile.sourcePath.path} -> ${par.parentInterface.name}::${par.name} (field)`;
        else if (par instanceof Property)
            location = `${par.parentClass.parentFile.sourcePath.path} -> ${par.parentClass.name}::${par.name} (property)`;
            else if (par instanceof Method)
            location = `${par.parentInterface.parentFile.sourcePath.path} -> ${par.parentInterface.name}::${par.name} (method)`;
        else if (par instanceof Constructor)
            location = `${par.parentClass.parentFile.sourcePath.path} -> ${par.parentClass.name}::constructor`;
        else if (par === null) { }
        else if (par instanceof Statement) { }
        else
            debugger;

        if (location === null && t !== null && t.currentFile !== null) {
            location = `${t.currentFile.sourcePath.path}`;
            if (t.currentInterface !== null) {
                location += ` -> ${t.currentInterface.name}`;
                if (t.currentMethod instanceof Method)
                    location += `::${t.currentMethod.name}`;
                else if (t.currentMethod instanceof Constructor)
                    location += `::constructor`;
                else if (t.currentMethod === null) { }
                else
                    debugger;
            }
        }

        return location;
    }

    get currentNodeRepr() { return TSOverviewGenerator.preview.nodeRepr(this.currentNode); }
    get currentStatementRepr() { return this.transformer.currentStatement === null ? "<null>" : TSOverviewGenerator.preview.stmt(this.transformer.currentStatement); }

    resetContext(transformer: AstTransformer = null): void {
        this.transformer = transformer;
    }

    log(type: LogType, msg: string) {
        const t = this.transformer;
        let text = (t !== null ? `[${t.name}] ` : "") + msg;

        if (this.currentNode !== null)
            text += `\n  Node: ${this.currentNodeRepr}`;

        const location = this.location;
        if (location !== null)
            text += `\n  Location: ${location}`;

        if (t !== null && t.currentStatement !== null)
            text += `\n  Statement: ${this.currentStatementRepr}`;

        if (this.lastContextInfo !== null)
            text += `\n  Context: ${this.lastContextInfo}`;

        if (type === LogType.Info)
            console.log(text);
        else if (type === LogType.Warning)
            console.error(`[WARNING] ${text}\n`);
        else if (type === LogType.Error)
            console.error(`${text}\n`);
        else
            debugger;

        if (type === LogType.Error || type === LogType.Warning)
            this.errors.push(new CompilationError(msg, type === LogType.Warning, t !== null ? t.name : null, this.currentNode));
    }

    info(msg: string): void {
        this.log(LogType.Info, msg);
    }

    warn(msg: string): void {
        this.log(LogType.Warning, msg);
    }

    throw(msg: string): void {
        this.log(LogType.Error, msg);
    }
}