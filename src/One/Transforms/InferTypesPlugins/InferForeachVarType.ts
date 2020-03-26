import { InferTypesPlugin } from "./Helpers/InferTypesPlugin";
import { ClassType, Type, InterfaceType, IInterfaceType, AnyType } from "../../Ast/AstTypes";
import { Statement, ForeachStatement } from "../../Ast/Statements";

export class InferForeachVarType extends InferTypesPlugin {
    constructor() { super("InferForeachVarType"); }

    handleStatement(stmt: Statement) { 
        if (stmt instanceof ForeachStatement) {
            stmt.items = this.main.runPluginsOn(stmt.items) || stmt.items;
            const arrayType = stmt.items.getType();
            let found = false;
            if (arrayType instanceof ClassType || arrayType instanceof InterfaceType) {
                const intfType = <IInterfaceType> arrayType;
                const isArrayType = this.main.currentFile.arrayTypes.some(x => x.decl === intfType.getDecl());
                if (isArrayType && intfType.typeArguments.length > 0) {
                    stmt.itemVar.type = intfType.typeArguments[0];
                    found = true;
                }
            }

            if (!found && !(arrayType instanceof AnyType))
                this.errorMan.throw(`Expected array as Foreach items variable, but got ${arrayType.repr()}`);

            this.main.processBlock(stmt.body);
            return true;
        }
        return false;
    }
}
