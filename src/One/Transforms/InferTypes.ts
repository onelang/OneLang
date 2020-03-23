import { AstTransformer } from "../AstTransformer";
import { Expression } from "../Ast/Expressions";
import { Package, Property, Field, IMethodBase, IVariableWithInitializer, Lambda, Block, IVariable, Method } from "../Ast/Types";
import { BasicTypeInfer } from "./InferTypesPlugins/BasicTypeInfer";
import { InferTypesPlugin } from "./InferTypesPlugins/Helpers/InferTypesPlugin";
import { ArrayAndMapLiteralTypeInfer } from "./InferTypesPlugins/ArrayAndMapLiteralTypeInfer";
import { ResolveFieldAndPropertyAccess } from "./InferTypesPlugins/ResolveFieldAndPropertyAccess";
import { ResolveMethodCalls } from "./InferTypesPlugins/ResolveMethodCalls";
import { LambdaResolver } from "./InferTypesPlugins/LambdaResolver";
import { TSOverviewGenerator } from "../../Utils/TSOverviewGenerator";
import { Statement } from "../Ast/Statements";
import { ResolveEnumMemberAccess } from "./InferTypesPlugins/ResolveEnumMemberAccess";
import { InferReturnType } from "./InferTypesPlugins/InferReturnType";
import { TypeScriptNullCoalesce } from "./InferTypesPlugins/TypeScriptNullCoalesce";
import { InferForeachVarType } from "./InferTypesPlugins/InferForeachVarType";
import { ResolveFuncCalls } from "./InferTypesPlugins/ResolveFuncCalls";
import { NullabilityCheckWithNot } from "./InferTypesPlugins/NullabilityCheckWithNot";
import { ResolveNewCalls } from "./InferTypesPlugins/ResolveNewCall";

enum InferTypesStage { Invalid, Fields, Properties, Methods }

export class InferTypes extends AstTransformer {
    name = "InferTypes";
    protected stage: InferTypesStage;
    plugins: InferTypesPlugin[] = [];
    logIdx = 0;

    constructor() {
        super();
        this.addPlugin(new BasicTypeInfer());
        this.addPlugin(new ArrayAndMapLiteralTypeInfer());
        this.addPlugin(new ResolveFieldAndPropertyAccess());
        this.addPlugin(new ResolveMethodCalls());
        this.addPlugin(new LambdaResolver());
        this.addPlugin(new InferReturnType());
        this.addPlugin(new ResolveEnumMemberAccess());
        this.addPlugin(new TypeScriptNullCoalesce());
        this.addPlugin(new InferForeachVarType());
        this.addPlugin(new ResolveFuncCalls());
        this.addPlugin(new NullabilityCheckWithNot());
        this.addPlugin(new ResolveNewCalls());
    }

    // allow plugins to run AstTransformer methods without running other plugins
    // TODO: should refactor to a private interface exposed only to plugins?
    public processLambda(lambda: Lambda) { return super.visitLambda(lambda); }
    public processMethodBase(method: IMethodBase) { return super.visitMethodBase(method); }
    public processBlock(block: Block) { return super.visitBlock(block); }
    public processVariable(variable: IVariable) { return super.visitVariable(variable); }
    public processStatement(stmt: Statement) { return super.visitStatement(stmt); }
    public processExpression(expr: Expression) { return super.visitExpression(expr); }

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

    protected runTransformRound(expr: Expression): Expression {
        this.errorMan.currentNode = expr;

        const transformers = this.plugins.filter(x => x.canTransform(expr));
        if (transformers.length > 1)
            this.errorMan.throw(`Multiple transformers found: ${transformers.map(x => x.name).join(', ')}`);
        if (transformers.length !== 1) return null;

        const plugin = transformers[0];
        this.errorMan.contextInfo.push(`[${++this.logIdx}] running transform plugin "${plugin.name}" on '${TSOverviewGenerator.nodeRepr(expr)}'...`);
        try {
            const newExpr = plugin.transform(expr);
            // expression changed, restart the type infering process on the new expression
            if (newExpr !== null)
                newExpr.parentNode = expr.parentNode;
            return newExpr;
        } catch (e) {
            this.errorMan.currentNode = expr;
            this.errorMan.throw(`Error while running type transformation phase: ${e}`);
        }
    }

    protected detectType(expr: Expression): boolean {
        for (const plugin of this.plugins) {
            if (!plugin.canDetectType(expr)) continue;
            this.errorMan.contextInfo.push(`[${++this.logIdx}] running type detection plugin "${plugin.name}" on '${TSOverviewGenerator.nodeRepr(expr)}'`);
            this.errorMan.currentNode = expr;
            try {
                if (plugin.detectType(expr))
                    return true;
            } catch (e) {
                this.errorMan.throw(`Error while running type detection phase: ${e}`);
            }
        }
        return false;
    }

    public visitExpression(expr: Expression): Expression {
        const newExpr = this.runTransformRound(expr);
        // if the plugin did not handle the expression, we use the default visit method
        const expr2 = newExpr !== null ? newExpr : super.visitExpression(expr) || expr;

        const detectSuccess = this.detectType(expr2);

        if (expr2.actualType === null) {
            if (detectSuccess)
                this.errorMan.throw("Type detection failed, although plugin tried to handle it");
            else
                this.errorMan.throw("Type detection failed: none of the plugins could resolve the type");
        }

        return expr2;
    }

    protected visitStatement(stmt: Statement) {
        this.currentStatement = stmt;

        for (const plugin of this.plugins)
            if (plugin.handleStatement(stmt))
                return null;

        return super.visitStatement(stmt);
    }

    protected visitField(field: Field) {
        if (this.stage !== InferTypesStage.Fields) return;
        super.visitField(field);
    }

    protected visitProperty(prop: Property) {
        if (this.stage !== InferTypesStage.Properties) return;

        for (const plugin of this.plugins)
            if (plugin.handleProperty(prop))
                return;

        super.visitProperty(prop);
    }

    protected visitMethodBase(method: IMethodBase) {
        if (this.stage !== InferTypesStage.Methods) return;

        for (const plugin of this.plugins)
            if (plugin.handleMethod(method))
                return;

        super.visitMethodBase(method);
    }

    public visitLambda(lambda: Lambda) {
        for (const plugin of this.plugins)
            if (plugin.handleLambda(lambda))
                return lambda;

        return super.visitLambda(lambda);
    }

    public visitPackage(pkg: Package) {
        for (const stage of [InferTypesStage.Fields, InferTypesStage.Properties, InferTypesStage.Methods]) {
            this.stage = stage;
            super.visitPackage(pkg);
        }
    }
}