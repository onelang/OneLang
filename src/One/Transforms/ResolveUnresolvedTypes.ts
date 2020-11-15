import { AstTransformer } from "../AstTransformer";
import { UnresolvedType, ClassType, InterfaceType, EnumType, GenericsType } from "../Ast/AstTypes";
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
            if (this.currentInterface !== null && this.currentInterface.typeArguments.includes(type.typeName))
                return new GenericsType(type.typeName);

            const symbol = this.currentFile.availableSymbols.get(type.typeName) || null;
            if (symbol === null) {
                this.errorMan.throw(`Unresolved type '${type.typeName}' was not found in available symbols`);
                return type;
            }
    
            if (symbol instanceof Class)
                return new ClassType(symbol, type.typeArguments);
            else if (symbol instanceof Interface)
                return new InterfaceType(symbol, type.typeArguments);
            else if (symbol instanceof Enum)
                return new EnumType(symbol);
            else {
                this.errorMan.throw(`Unknown symbol type: ${symbol}`);
                return type;
            }
        }
        else 
            return type;
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
                return expr;
            }
        } else {
            return super.visitExpression(expr);
        }
    }
}