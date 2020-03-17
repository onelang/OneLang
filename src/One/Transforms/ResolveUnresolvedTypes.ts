import { AstTransformer } from "../AstTransformer";
import { Type, UnresolvedType, ClassType, InterfaceType, EnumType } from "../Ast/AstTypes";
import { SourceFile, Class, Interface, Enum } from "../Ast/Types";
import { ErrorManager } from "../ErrorManager";
import { Expression, UnresolvedNewExpression, NewExpression } from "../Ast/Expressions";

export class ResolveUnresolvedTypes extends AstTransformer<void> {
    file: SourceFile;

    constructor(public errorMan = new ErrorManager()) { super(); }

    protected visitType(type: Type) {
        super.visitType(type);
        if (!(type instanceof UnresolvedType)) return null;
        
        const symbol = this.file.availableSymbols.get(type.typeName) || null;
        if (symbol === null) {
            this.errorMan.throw(`Unresolved type '${type.typeName}' was not found in available symbols`);
            return null;
        }

        if (symbol instanceof Class)
            return new ClassType(symbol, type.typeArguments);
        else if (symbol instanceof Interface)
            return new InterfaceType(symbol, type.typeArguments);
        else if (symbol instanceof Enum)
            return new EnumType(symbol);
        else {
            this.errorMan.throw(`Unknown symbol type: ${symbol}`);
            return null;
        }
    }

    protected visitExpression(expr: Expression): Expression {
        if (expr instanceof UnresolvedNewExpression) {
            const classType = this.visitType(expr.cls);
            if (!(classType instanceof ClassType)) {
                this.errorMan.throw(`Excepted ClassType, but got ${classType}`);
                return null;
            }
            const newExpr = new NewExpression(classType, expr.args);
            super.visitExpression(newExpr);
            return newExpr;
        } else {
            return super.visitExpression(expr);
        }
    }


    public visitSourceFile(sourceFile: SourceFile) {
        this.file = sourceFile;

        this.errorMan.resetContext("ResolveUnresolvedTypes", this.file);
        super.visitSourceFile(sourceFile);
        this.errorMan.resetContext();

        return null;
    }
}