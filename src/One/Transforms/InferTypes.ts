import { AstTransformer } from "../AstTransformer";
import { Expression } from "../Ast/Expressions";
import { Package, Property, Field, IMethodBase, IVariableWithInitializer } from "../Ast/Types";
import { BasicTypeInfer } from "./InferTypesPlugins/BasicTypeInfer";
import { InferTypesPlugin } from "./InferTypesPlugins/InferTypesPlugin";
import { ArrayAndMapLiteralTypeInfer } from "./InferTypesPlugins/ArrayAndMapLiteralTypeInfer";

enum InferTypesStage { Invalid, Fields, Properties, Methods }

export class InferTypes extends AstTransformer {
    name = "InferTypes";
    protected stage: InferTypesStage;
    plugins: InferTypesPlugin[] = [];

    constructor() {
        super();
        this.addPlugin(new BasicTypeInfer());
        this.addPlugin(new ArrayAndMapLiteralTypeInfer());
    }

    addPlugin(plugin: InferTypesPlugin) {
        plugin.main = this;
        plugin.errorMan = this.errorMan;
        this.plugins.push(plugin);
    }

    visitVariableWithInitializer(variable: IVariableWithInitializer): IVariableWithInitializer {
        if (variable.type !== null && variable.initializer !== null)
            variable.initializer.setExpectedType(variable.type);

        super.visitVariableWithInitializer(variable);

        if (variable.type === null && variable.initializer !== null)
            variable.type = variable.initializer.getType();

        return null;
    }

    protected runPluginRound(expr: Expression): Expression {
        for (const plugin of this.plugins) {
            const newExpr = plugin.visitExpression(expr);

            if (newExpr !== null && newExpr !== expr) {
                // expression changed, restart the type infering process on the new expression
                return newExpr;            
            } else if (expr.actualType !== null) {
                // type was found, our job is done here
                return expr;
            }
        }

        this.errorMan.throw(`Type detection failed`);
        return null;
    }

    protected visitExpression(expr: Expression): Expression {
        super.visitExpression(expr);

        this.errorMan.currentNode = expr;
        if (expr.actualType === null) {
            for (let iRound = 100; iRound >= 0; iRound--) {
                try {
                    expr = this.runPluginRound(expr);
                } catch (e) {
                    this.errorMan.throw(`Error while running type detection plugin: ${e}`);
                    break;
                }

                if (expr === null || expr.actualType !== null)
                    break;

                if (iRound === 0)
                    throw new Error(`Infinite loop detected in type interfering`);
            }
        }

        this.errorMan.currentNode = null;
        return expr;
    }

    protected visitField(field: Field) {
        if (this.stage !== InferTypesStage.Fields) return;
        super.visitField(field);
    }

    protected visitProperty(prop: Property) {
        if (this.stage !== InferTypesStage.Properties) return;
        super.visitProperty(prop);
    }

    protected visitMethodBase(method: IMethodBase) {
        if (this.stage !== InferTypesStage.Methods) return;
        super.visitMethodBase(method);
    }

    public visitPackage(pkg: Package) {
        for (const stage of [InferTypesStage.Fields, InferTypesStage.Properties, InferTypesStage.Methods]) {
            this.stage = stage;
            super.visitPackage(pkg);
        }
    }
}