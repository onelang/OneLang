import { AstTransformer } from "../AstTransformer";
import { SourceFile, Class, Enum, Method, Block, Lambda, GlobalFunction, IMethodBase, Constructor, Interface } from "../Ast/Types";
import { ErrorManager } from "../ErrorManager";
import { Identifier, Expression } from "../Ast/Expressions";
import { IReferencable, Reference, StaticThisReference, ThisReference, SuperReference } from "../Ast/References";
import { VariableDeclaration, ForStatement, ForeachStatement, Statement, IfStatement, TryStatement } from "../Ast/Statements";
import { ClassType } from "../Ast/AstTypes";

class SymbolLookup {
    errorMan: ErrorManager = new ErrorManager();
    levelSymbols: string[][] = [];
    levelNames: string[] = [];
    currLevel: string[];
    symbols = new Map<string, IReferencable>();

    throw(msg: string) { 
        this.errorMan.throw(`${msg} (context: ${this.levelNames.join(" > ")})`);
    }

    pushContext(name: string) {
        this.levelNames.push(name);
        this.currLevel = [];
        this.levelSymbols.push(this.currLevel);
    }

    addSymbol(name: string, ref: IReferencable) {
        if (this.symbols.has(name))
            this.throw(`Symbol shadowing: ${name}`);
        this.symbols.set(name, ref);
        this.currLevel.push(name);
    }

    popContext() {
        for (const name of this.currLevel)
            this.symbols.delete(name);
        this.levelSymbols.pop();
        this.levelNames.pop();
        this.currLevel = this.levelSymbols.length === 0 ? null : this.levelSymbols[this.levelSymbols.length - 1];
    }

    getSymbol(name: string): IReferencable {
        return this.symbols.get(name) || null;
    }
}

export class ResolveIdentifiers extends AstTransformer {
    symbolLookup: SymbolLookup;

    constructor() {
        super("ResolveIdentifiers");
        this.symbolLookup = new SymbolLookup();
    }

    protected visitIdentifier(id: Identifier): Expression {
        super.visitIdentifier(id);
        const symbol = this.symbolLookup.getSymbol(id.text);
        if (symbol === null) {
            this.errorMan.throw(`Identifier '${id.text}' was not found in available symbols`);
            return null;
        }

        let ref: Reference = null;
        if (symbol instanceof Class && id.text === "this") {
            const withinStaticMethod = this.currentMethod instanceof Method && this.currentMethod.isStatic;
            ref = withinStaticMethod ? <Reference>new StaticThisReference(symbol) : new ThisReference(symbol);
        } else if (symbol instanceof Class && id.text === "super") {
            ref = new SuperReference(symbol);
        } else {
            ref = symbol.createReference();
        }
        ref.parentNode = id.parentNode;
        return ref;
    }

    protected visitStatement(stmt: Statement): Statement { 
        if (stmt instanceof ForStatement) {
            this.symbolLookup.pushContext(`For`);
            if (stmt.itemVar !== null)
                this.symbolLookup.addSymbol(stmt.itemVar.name, stmt.itemVar);
            super.visitStatement(stmt);
            this.symbolLookup.popContext();
        } else if (stmt instanceof ForeachStatement) {
            this.symbolLookup.pushContext(`Foreach`);
            this.symbolLookup.addSymbol(stmt.itemVar.name, stmt.itemVar);
            super.visitStatement(stmt);
            this.symbolLookup.popContext();
        } else if (stmt instanceof TryStatement) {
            this.symbolLookup.pushContext(`Try`);
            this.visitBlock(stmt.tryBody);
            if (stmt.catchBody !== null) {
                this.symbolLookup.addSymbol(stmt.catchVar.name, stmt.catchVar);
                this.visitBlock(stmt.catchBody);
                this.symbolLookup.popContext();
            }
            if (stmt.finallyBody !== null)
                this.visitBlock(stmt.finallyBody);
        } else {
            return super.visitStatement(stmt);
        }
        return null;
    }

    protected visitLambda(lambda: Lambda): Lambda {
        this.symbolLookup.pushContext(`Lambda`);
        for (const param of lambda.parameters)
            this.symbolLookup.addSymbol(param.name, param);
        super.visitBlock(lambda.body); // directly process method's body without opening a new scope again
        this.symbolLookup.popContext();
        return null;
    }

    protected visitBlock(block: Block): Block {
        this.symbolLookup.pushContext("block");
        super.visitBlock(block);
        this.symbolLookup.popContext();
        return null;
    }

    protected visitVariableDeclaration(stmt: VariableDeclaration): VariableDeclaration {
        this.symbolLookup.addSymbol(stmt.name, stmt);
        return super.visitVariableDeclaration(stmt);
    }
    
    protected visitMethodBase(method: IMethodBase) {
        this.symbolLookup.pushContext(method instanceof Method ? `Method: ${method.name}` : method instanceof Constructor ? "constructor" : "???");

        for (const param of method.parameters) {
            this.symbolLookup.addSymbol(param.name, param);
            if (param.initializer !== null)
                this.visitExpression(param.initializer);
        }

        if (method.body !== null)
            super.visitBlock(method.body); // directly process method's body without opening a new scope again

        this.symbolLookup.popContext();
    }

    protected visitClass(cls: Class) {
        this.symbolLookup.pushContext(`Class: ${cls.name}`);
        this.symbolLookup.addSymbol("this", cls);
        if (cls.baseClass instanceof ClassType)
            this.symbolLookup.addSymbol("super", cls.baseClass.decl);
        super.visitClass(cls);
        this.symbolLookup.popContext();
    }

    public visitSourceFile(sourceFile: SourceFile) {
        this.errorMan.resetContext(this);
        this.symbolLookup.pushContext(`File: ${sourceFile.sourcePath}`);

        for (const symbol of sourceFile.availableSymbols.values()) {
            if (symbol instanceof Class) {
                this.symbolLookup.addSymbol(symbol.name, symbol);
            } else if (symbol instanceof Interface) {
                // TODO: is it okay?
            } else if (symbol instanceof Enum) {
                this.symbolLookup.addSymbol(symbol.name, symbol);
            } else if (symbol instanceof GlobalFunction) {
                this.symbolLookup.addSymbol(symbol.name, symbol);
            } else
                debugger;
        }

        super.visitSourceFile(sourceFile);

        this.symbolLookup.popContext();
        this.errorMan.resetContext();
    }
}