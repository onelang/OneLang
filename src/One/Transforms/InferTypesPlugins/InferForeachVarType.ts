import { InferTypesPlugin } from "./Helpers/InferTypesPlugin";
import { ClassType, Type, InterfaceType } from "../../Ast/AstTypes";
import { Statement, ForeachStatement } from "../../Ast/Statements";

export class InferForeachVarType extends InferTypesPlugin {
    name = "InferForeachVarType";

    handleStatement(stmt: Statement) { 
        if (stmt instanceof ForeachStatement) {
            stmt.items = this.main.visitExpression(stmt.items) || stmt.items;
            const arrayType = stmt.items.getType();
            if (arrayType instanceof ClassType && this.main.currentFile.arrayTypes.some(x => x.decl === arrayType.decl)) {
                stmt.itemVar.type = arrayType.typeArguments[0];
            } else if (arrayType instanceof InterfaceType && this.main.currentFile.arrayTypes.some(x => x.decl === arrayType.decl)) {
                stmt.itemVar.type = arrayType.typeArguments[0];
            } else
                this.errorMan.throw(`Expected array as Foreach items variable, but got ${arrayType.repr()}`);
            this.main.processBlock(stmt.body);
            return true;
        }
        return false;
    }
}
