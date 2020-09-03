import { AstTransformer } from "../AstTransformer";
import { UnresolvedType, ClassType, InterfaceType, EnumType } from "../Ast/AstTypes";
import { Class, Interface, Enum } from "../Ast/Types";
import { Expression, UnresolvedNewExpression, NewExpression } from "../Ast/Expressions";
import { IType } from "../Ast/Interfaces";

/**
 * Replaces UnresolvedType to either ClassType, InterfaceType or EnumType.
 * Also converts UnresolvedNewExpression (with UnresolvedType) to NewExpression (with explicit ClassType).
 */
export class ResolveUnresolvedTypes extends AstTransformer {
    constructor() { super("ResolveUnresolvedTypes"); }

    protected visitType(type: IType): IType {
        super.visitType(type);
        if (type instanceof UnresolvedType) {
            const symbol = this.currentFile.availableSymbols.get(type.typeName) || null;
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
        else 
            return null;
    }

    protected visitExpression(expr: Expression): Expression {
        if (expr instanceof UnresolvedNewExpression) {
            const clsType = this.visitType(expr.cls);
            if (clsType instanceof ClassType) {
                const newExpr = new NewExpression(clsType, expr.args);
                newExpr.parentNode = expr.parentNode;
                super.visitExpression(newExpr);
                return newExpr;
            } else {
                this.errorMan.throw(`Excepted ClassType, but got ${clsType}`);
                return null;
            }
        } else {
            return super.visitExpression(expr);
        }
    }
}