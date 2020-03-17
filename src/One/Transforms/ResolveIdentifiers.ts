import { AstTransformer } from "../AstTransformer";
import { SourceFile, Class, Enum, Method, Block, Lambda, GlobalFunction } from "../Ast/Types";
import { ErrorManager } from "../ErrorManager";
import { Identifier } from "../Ast/Expressions";
import { IReferencable, Reference } from "../Ast/References";
import { VariableDeclaration, ForStatement, ForeachStatement, Statement, IfStatement } from "../Ast/Statements";
import { ClassType } from "../Ast/AstTypes";

class SymbolLookup {
    levelSymbols: string[][] = [];
    levelNames: string[] = [];
    currLevel: string[];
    symbols = new Map<string, IReferencable>();

    constructor(public errorMan: ErrorManager) { }

    throw(msg: string) { 
        this.errorMan.throw(`${msg} (context: ${this.levelNames.join(" > ")})`);
    }

    pushContext(name: string) {
        this.levelNames.push(name);
        this.currLevel = [];
        this.levelSymbols.push(this.currLevel);
    }

    addSymbol(name: string, ref: IReferencable) {
        if (this.symbols.get(name))
            this.throw(`Symbol shadowing: ${name}`);
        this.symbols.set(name, ref);
        this.currLevel.push(name);
    }

    popContext() {
        for (const name of this.currLevel)
            this.symbols.delete(name);
        this.levelSymbols.pop();
        this.levelNames.pop();
        this.currLevel = this.levelSymbols[this.levelSymbols.length - 1];
    }

    getSymbol(name: string): IReferencable {
        return this.symbols.get(name) || null;
    }
}

export class ResolveIdentifiers extends AstTransformer<void> {
    file: SourceFile;
    symbolLookup: SymbolLookup;

    constructor(public errorMan = new ErrorManager()) {
        super();
        this.symbolLookup = new SymbolLookup(errorMan);
    }

    protected visitIdentifier(id: Identifier): Reference {
        super.visitIdentifier(id);
        const symbol = this.symbolLookup.getSymbol(id.text);
        if (symbol === null) {
            this.errorMan.throw(`Identifier '${id.text}' was not found in available symbols`);
            return null;
        }
        const ref = symbol.createReference(id.text);
        ref.parentExpr = id.parentExpr;
        return ref;
    }

    protected visitStatement(stmt: Statement): Statement { 
        if (stmt instanceof ForStatement) {
            this.symbolLookup.pushContext(`For`);
            if (stmt.itemVar)
                this.symbolLookup.addSymbol(stmt.itemVar.name, stmt.itemVar);
            super.visitStatement(stmt);
            this.symbolLookup.popContext();
        } else if (stmt instanceof ForeachStatement) {
            this.symbolLookup.pushContext(`Foreach`);
            this.symbolLookup.addSymbol(stmt.itemVar.name, stmt.itemVar);
            super.visitStatement(stmt);
            this.symbolLookup.popContext();
            return null;
        } else {
            return super.visitStatement(stmt);
        }
    }

    protected visitLambda(lambda: Lambda) {
        this.symbolLookup.pushContext(`Lambda`);
        for (const param of lambda.parameters)
            this.symbolLookup.addSymbol(param.name, param);
        super.visitBlock(lambda.body); // directly process method's body without opening a new scope again
        this.symbolLookup.popContext();
        return null;
    }

    protected visitBlock(block: Block) {
        this.symbolLookup.pushContext("block");
        super.visitBlock(block);
        this.symbolLookup.popContext();
        return null;
    }

    protected visitVariableDeclaration(stmt: VariableDeclaration): VariableDeclaration {
        this.symbolLookup.addSymbol(stmt.name, stmt);
        return super.visitVariableDeclaration(stmt);
    }
    
    public visitMethodBase(method: Method) {
        this.symbolLookup.pushContext(`Method: ${method.name}`);
        for (const param of method.parameters)
            this.symbolLookup.addSymbol(param.name, param);
        if (method.body)
            super.visitBlock(method.body); // directly process method's body without opening a new scope again
        this.symbolLookup.popContext();
        return null;
    }

    public visitClass(cls: Class) {
        this.symbolLookup.pushContext(`Class: ${cls.name}`);
        this.symbolLookup.addSymbol("this", cls);
        if (cls.baseClass instanceof ClassType)
            this.symbolLookup.addSymbol("super", cls.baseClass.decl);
        super.visitClass(cls);
        this.symbolLookup.popContext();
        return null;
    }

    public visitSourceFile(sourceFile: SourceFile) {
        this.file = sourceFile;

        this.errorMan.resetContext("ResolveIdentifiers", sourceFile);
        this.symbolLookup.pushContext(`File: ${sourceFile.sourcePath}`);

        for (const symbol of sourceFile.availableSymbols.values()) {
            if (symbol instanceof Class)
                this.symbolLookup.addSymbol(symbol.name, symbol);
            else if (symbol instanceof Enum)
                this.symbolLookup.addSymbol(symbol.name, symbol);
            else if (symbol instanceof GlobalFunction)
                this.symbolLookup.addSymbol(symbol.name, symbol);
        }

        super.visitSourceFile(sourceFile);

        this.symbolLookup.popContext();
        this.errorMan.resetContext();

        return null;
    }
}