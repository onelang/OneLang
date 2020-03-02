import { AstTransformer } from "../AstTransformer";
import { SourceFile, Class, Interface, Enum, Method, Block, Lambda, GlobalFunction } from "../Ast/Types";
import { ErrorManager } from "../ErrorManager";
import { Identifier } from "../Ast/Expressions";
import { ClassReference, EnumReference, ThisReference, IReference, VariableDeclarationReference, ForVariableReference } from "../Ast/References";
import { VariableDeclaration, ForStatement, ForeachStatement } from "../Ast/Statements";
import { ClassType } from "../Ast/AstTypes";

class SymbolLookup {
    levelSymbols: string[][] = [];
    levelNames: string[] = [];
    currLevel: string[];
    symbols = new Map<string, IReference>();

    constructor(public errorMan: ErrorManager) { }

    throw(msg: string) { 
        this.errorMan.throw(`${msg} (context: ${this.levelNames.join(" > ")})`);
    }

    pushContext(name: string, references: IReference[]) {
        this.levelNames.push(name);
        this.currLevel = [];
        this.levelSymbols.push(this.currLevel);

        for (const ref of references)
            this.addReference(ref);
    }

    addReference(ref: IReference) {
        const name = ref.getName();
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

    getSymbol(name: string): IReference {
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

    protected visitIdentifier(id: Identifier) {
        super.visitIdentifier(id);
        const ref = this.symbolLookup.getSymbol(id.text);
        if (ref === null)
            return this.errorMan.throw(`Identifier '${id.text}' was not found in available symbols`);
        return ref;
    }

    protected visitForStatement(stmt: ForStatement): ForStatement {
        this.symbolLookup.pushContext(`For`, stmt.itemVar ? [stmt.itemVar.selfReference] : []);
        super.visitForStatement(stmt);
        this.symbolLookup.popContext();
        return null;
    }

    protected visitForeachStatement(stmt: ForeachStatement): ForeachStatement {
        this.symbolLookup.pushContext(`Foreach`, [stmt.itemVar.selfReference]);
        super.visitForeachStatement(stmt);
        this.symbolLookup.popContext();
        return null;
    }

    protected visitLambda(lambda: Lambda) {
        this.symbolLookup.pushContext(`Lambda`, lambda.parameters.map(x => x.selfReference));
        super.visitBlock(lambda.body); // directly process method's body without opening a new scope again
        this.symbolLookup.popContext();
        return null;
    }

    protected visitBlock(block: Block) {
        this.symbolLookup.pushContext("block", []);
        super.visitBlock(block);
        this.symbolLookup.popContext();
        return null;
    }

    protected visitVariableDeclaration(stmt: VariableDeclaration): VariableDeclaration {
        this.symbolLookup.addReference(new VariableDeclarationReference(stmt));
        return super.visitVariableDeclaration(stmt);
    }
    
    public visitMethodBase(method: Method) {
        this.symbolLookup.pushContext(`Method: ${method.name}`, method.parameters.map(x => x.selfReference));
        if (method.body)
            super.visitBlock(method.body); // directly process method's body without opening a new scope again
        this.symbolLookup.popContext();
        return null;
    }

    public visitClass(cls: Class) {
        const refs: IReference[] = [cls.thisReference];
        if (cls.baseClass instanceof ClassType)
            refs.push(cls.baseClass.decl.superReference);
        this.symbolLookup.pushContext(`Class: ${cls.name}`, refs);
        super.visitClass(cls);
        this.symbolLookup.popContext();
        return null;
    }

    public visitSourceFile(sourceFile: SourceFile) {
        this.file = sourceFile;

        const refs: IReference[] = [];
        for (const symbol of Object.values(sourceFile.availableSymbols))
            if (symbol instanceof Class || symbol instanceof Enum || symbol instanceof GlobalFunction)
                refs.push(symbol.selfReference);

        this.errorMan.resetContext("ResolveIdentifiers", sourceFile);
        this.symbolLookup.pushContext(`File: ${sourceFile.sourcePath}`, refs);

        super.visitSourceFile(sourceFile);

        this.symbolLookup.popContext();
        this.errorMan.resetContext();

        return null;
    }
}