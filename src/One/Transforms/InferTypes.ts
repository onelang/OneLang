import { AstTransformer } from "../AstTransformer";
import { Expression } from "../Ast/Expressions";
import { Package, Property, Field, IMethodBase, IVariableWithInitializer, Lambda, IVariable, Method, Class, SourceFile } from "../Ast/Types";
import { BasicTypeInfer } from "./InferTypesPlugins/BasicTypeInfer";
import { InferTypesPlugin } from "./InferTypesPlugins/Helpers/InferTypesPlugin";
import { ArrayAndMapLiteralTypeInfer } from "./InferTypesPlugins/ArrayAndMapLiteralTypeInfer";
import { ResolveFieldAndPropertyAccess } from "./InferTypesPlugins/ResolveFieldAndPropertyAccess";
import { ResolveMethodCalls } from "./InferTypesPlugins/ResolveMethodCalls";
import { LambdaResolver } from "./InferTypesPlugins/LambdaResolver";
import { Statement, Block, ReturnStatement } from "../Ast/Statements";
import { ResolveEnumMemberAccess } from "./InferTypesPlugins/ResolveEnumMemberAccess";
import { InferReturnType } from "./InferTypesPlugins/InferReturnType";
import { TypeScriptNullCoalesce } from "./InferTypesPlugins/TypeScriptNullCoalesce";
import { InferForeachVarType } from "./InferTypesPlugins/InferForeachVarType";
import { ResolveFuncCalls } from "./InferTypesPlugins/ResolveFuncCalls";
import { NullabilityCheckWithNot } from "./InferTypesPlugins/NullabilityCheckWithNot";
import { ResolveNewCalls } from "./InferTypesPlugins/ResolveNewCall";
import { ResolveElementAccess } from "./InferTypesPlugins/ResolveElementAccess";
import { ClassType } from "../Ast/AstTypes";

enum InferTypesStage { Invalid, Fields, Properties, Methods }

export class InferTypes extends AstTransformer {
    protected stage: InferTypesStage;
    plugins: InferTypesPlugin[] = [];
    contextInfoIdx = 0;

    constructor() {
        super("InferTypes");
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
        this.addPlugin(new ResolveElementAccess());
    }

    // allow plugins to run AstTransformer methods without running other plugins
    // TODO: should refactor to a private interface exposed only to plugins?
    
    // WARNING: processLambda intentionally calls visitMethodBase, because if 
    // it would call super.visitLambda -> that would call this.visitMethodBase
    // which would check stage, but we should not check stage at this point
    // (if a lambda is in a field constructor, then the type infer would simple
    // skip it which we don't want to)
    // 
    // TODO: seriously rethink this whole approach, because looks fragile and complicated
    public processLambda(lambda: Lambda) { super.visitMethodBase(lambda); }
    public processMethodBase(method: IMethodBase) { super.visitMethodBase(method); }
    public processBlock(block: Block) { super.visitBlock(block); }
    public processVariable(variable: IVariable) { super.visitVariable(variable); }
    public processStatement(stmt: Statement) { super.visitStatement(stmt); }
    public processExpression(expr: Expression) { super.visitExpression(expr); }

    addPlugin(plugin: InferTypesPlugin): void {
        plugin.main = this;
        plugin.errorMan = this.errorMan;
        this.plugins.push(plugin);
    }

    protected visitVariableWithInitializer(variable: IVariableWithInitializer): IVariableWithInitializer {
        if (variable.type !== null && variable.initializer !== null)
            variable.initializer.setExpectedType(variable.type);

        variable = super.visitVariableWithInitializer(variable);

        if (variable.type === null && variable.initializer !== null)
            variable.type = variable.initializer.getType();

        return variable;
    }

    protected runTransformRound(expr: Expression): Expression {
        if (expr.actualType !== null) return expr;

        this.errorMan.currentNode = expr;

        const transformers = this.plugins.filter(x => x.canTransform(expr));
        if (transformers.length > 1)
            this.errorMan.throw(`Multiple transformers found: ${transformers.map(x => x.name).join(', ')}`);
        if (transformers.length !== 1) return expr;

        const plugin = transformers[0];
        this.contextInfoIdx++;
        this.errorMan.lastContextInfo = `[${this.contextInfoIdx}] running transform plugin "${plugin.name}"`;
        try {
            const newExpr = plugin.transform(expr);
            // expression changed, restart the type infering process on the new expression
            if (newExpr !== null)
                newExpr.parentNode = expr.parentNode;
            return newExpr;
        } catch (e) {
            this.errorMan.currentNode = expr;
            this.errorMan.throw(`Error while running type transformation phase: ${e}`);
            return expr;
        }
    }

    protected detectType(expr: Expression): boolean {
        for (const plugin of this.plugins) {
            if (!plugin.canDetectType(expr)) continue;
            this.contextInfoIdx++;
            this.errorMan.lastContextInfo = `[${this.contextInfoIdx}] running type detection plugin "${plugin.name}"`;
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

    protected visitExpression(expr: Expression): Expression {
        let transExpr: Expression = expr;
        while (true) {
            const newExpr = this.runTransformRound(transExpr);
            if (newExpr === transExpr) break;
            transExpr = newExpr;
        }

        // if the plugin did not handle the expression, we use the default visit method
        if (transExpr === expr)
            transExpr = super.visitExpression(expr);

        if (transExpr.actualType !== null) return transExpr;

        const detectSuccess = this.detectType(transExpr);

        if (transExpr.actualType === null) {
            if (detectSuccess)
                this.errorMan.throw("Type detection failed, although plugin tried to handle it");
            else
                this.errorMan.throw("Type detection failed: none of the plugins could resolve the type");
        }

        return transExpr;
    }

    protected visitStatement(stmt: Statement) {
        this.currentStatement = stmt;

        if (stmt instanceof ReturnStatement && stmt.expression !== null && this.currentClosure instanceof Method && this.currentClosure.returns !== null) {
            let returnType = this.currentClosure.returns;
            if (returnType instanceof ClassType && returnType.decl === this.currentFile.literalTypes.promise.decl && this.currentClosure.async)
                returnType = returnType.typeArguments[0];
            stmt.expression.setExpectedType(returnType);
        }

        for (const plugin of this.plugins)
            if (plugin.handleStatement(stmt))
                return stmt;

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

    protected visitLambda(lambda: Lambda) {
        if (lambda.actualType !== null) return lambda;

        const prevClosure = this.currentClosure;
        this.currentClosure = lambda;

        for (const plugin of this.plugins)
            if (plugin.handleLambda(lambda))
                return lambda;

        this.currentClosure = prevClosure;
        super.visitMethodBase(lambda);
        return lambda;
    }

    public runPluginsOn(expr: Expression) { return this.visitExpression(expr); }

    protected visitClass(cls: Class): void {
        if (cls.attributes["external"] === "true") return;
        super.visitClass(cls);
    }

    public visitFiles(files: SourceFile[]): void {
        for (const stage of [InferTypesStage.Fields, InferTypesStage.Properties, InferTypesStage.Methods]) {
            this.stage = stage;
            for (const file of files)
                this.visitFile(file);
        }
    }
}