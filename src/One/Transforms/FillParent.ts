import { SourceFile, Method, IInterface, Enum, Interface, Class, Field, Property, IAstNode, IMethodBase, Constructor, GlobalFunction, Lambda } from "../Ast/Types";
import { Statement } from "../Ast/Statements";
import { Expression } from "../Ast/Expressions";
import { AstTransformer } from "../AstTransformer";

/**
 * Fills Expression's parentNode field
 */
export class FillParent extends AstTransformer {
    parentNodeStack: IAstNode[] = [];

    constructor() { super("FillParent"); }

    protected visitExpression(expr: Expression): Expression {
        if (this.parentNodeStack.length === 0) debugger;
        expr.parentNode = this.parentNodeStack[this.parentNodeStack.length - 1];
        this.parentNodeStack.push(expr);
        super.visitExpression(expr);
        this.parentNodeStack.pop();
        return null;
    }

    protected visitStatement(stmt: Statement): Statement {
        this.parentNodeStack.push(stmt);
        super.visitStatement(stmt);
        this.parentNodeStack.pop();
        return null;
    }

    protected visitEnum(enum_: Enum) {
        enum_.parentFile = this.currentFile;
        super.visitEnum(enum_);
        for (const value of enum_.values)
            value.parentEnum = enum_;
    }

    protected visitInterface(intf: Interface) { 
        intf.parentFile = this.currentFile;
        super.visitInterface(intf);
    }

    protected visitClass(cls: Class) { 
        cls.parentFile = this.currentFile;
        super.visitClass(cls);
    }

    protected visitGlobalFunction(func: GlobalFunction) {
        func.parentFile = this.currentFile;
        super.visitGlobalFunction(func);
    }

    protected visitField(field: Field) {
        field.parentInterface = this.currentInterface;

        this.parentNodeStack.push(field);
        super.visitField(field);
        this.parentNodeStack.pop();
    }

    protected visitProperty(prop: Property) { 
        prop.parentClass = <Class> this.currentInterface;

        this.parentNodeStack.push(prop);
        super.visitProperty(prop);
        this.parentNodeStack.pop();
    }

    protected visitMethodBase(method: IMethodBase) { 
        if (method instanceof Constructor) {
            method.parentClass = <Class> this.currentInterface;
        } else if (method instanceof Method) {
            method.parentInterface = this.currentInterface;
        } else if (method instanceof GlobalFunction) {
        } else if (method instanceof Lambda) {
        } else
            debugger;

        for (const param of method.parameters)
            param.parentMethod = method;

        this.parentNodeStack.push(method);
        super.visitMethodBase(method);
        this.parentNodeStack.pop();
    }

    public visitSourceFile(file: SourceFile): void {
        for (const imp of file.imports)
            imp.parentFile = file;

        super.visitSourceFile(file);
    }
}