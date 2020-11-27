import { OneYaml, ValueType, YamlValue } from "One.Yaml-v0.1";
import { ExpressionParser } from "../Parsers/Common/ExpressionParser";
import { Expression, GlobalFunctionCallExpression, ICallExpression, Identifier, IMethodCallExpression, InstanceMethodCallExpression, PropertyAccessExpression, StaticMethodCallExpression, UnresolvedCallExpression } from "../One/Ast/Expressions";
import { IExpression, IType } from "../One/Ast/Interfaces";
import { Statement } from "../One/Ast/Statements";
import { IGeneratorPlugin } from "./IGeneratorPlugin";
import { Reader } from "../Parsers/Common/Reader";
import { BooleanValue, ICallableValue, IVMValue, ObjectValue, StringValue } from "../VM/Values";
import { IInstanceMemberReference, InstanceFieldReference, InstancePropertyReference, StaticFieldReference, StaticPropertyReference, VariableReference } from "../One/Ast/References";
import { IClassMember } from "../One/Ast/Types";
import { TemplateParser } from "../Template/TemplateParser";
import { IGenerator } from "./IGenerator";
import { ExprVM, IVMHooks, VMContext } from "../VM/ExprVM";
import { TypeScriptParser2 } from "../Parsers/TypeScriptParser";
import { ClassType, TypeHelper } from "../One/Ast/AstTypes";

export class CodeTemplate {
    constructor(public template: string, public includes: string[], public ifExpr: Expression) { }
}

export class CallTemplate {
    constructor(public className: string, public methodName: string, 
        public args: string[], public template: CodeTemplate) { }
}

export class FieldAccessTemplate {
    constructor(public className: string, public fieldName: string, public template: CodeTemplate) { }
}

export class ExpressionValue implements IVMValue {
    constructor(public value: Expression) { }
    
    equals(other: IVMValue): boolean {
        return other instanceof ExpressionValue && other.value === this.value;
    }
}

// make this any type instead?
export class TypeValue implements IVMValue {
    constructor(public type: IType) { }

    equals(other: IVMValue): boolean {
        return other instanceof TypeValue && TypeHelper.equals(other.type, this.type);
    }
}

export class LambdaValue implements ICallableValue {
    constructor(public callback: (args: IVMValue[]) => IVMValue) { }
    equals(other: IVMValue): boolean { return false; }
    call(args: IVMValue[]): IVMValue { return this.callback(args); }
}

export class TemplateFileGeneratorPlugin implements IGeneratorPlugin, IVMHooks {
    methods: { [name: string]: CallTemplate[] } = {};
    fields: { [name: string]: FieldAccessTemplate } = {};
    modelGlobals: { [name: string]: IVMValue } = {};

    constructor(public generator: IGenerator, templateYaml: string) {
        const root = OneYaml.load(templateYaml);
        const exprDict = root.dict("expressions");

        for (const exprStr of Object.keys(exprDict)) {
            const val = exprDict[exprStr];
            const ifStr = val.str("if");
            const ifExpr = ifStr === null ? null : new TypeScriptParser2(ifStr, null).parseExpression();
            const tmpl = val.type() === ValueType.String ? 
                new CodeTemplate(val.asStr(), [], null) : 
                new CodeTemplate(val.str("template"), val.strArr("includes"), ifExpr);

            this.addExprTemplate(exprStr, tmpl);
        }
    }

    propAccess(obj: IVMValue, propName: string): IVMValue {
        if (obj instanceof ExpressionValue && propName === "type")
            return new TypeValue(obj.value.getType());
        if (obj instanceof TypeValue && propName === "name" && obj.type instanceof ClassType)
            return new StringValue(obj.type.decl.name);
        return null;
    }

    stringifyValue(value: IVMValue): string {
        if (value instanceof ExpressionValue) {
            const result = this.generator.expr(value.value);
            return result;
        }
        return null;
    }

    addMethod(name: string, callTmpl: CallTemplate): void {
        if (!(name in this.methods)) this.methods[name] = [];
        this.methods[name].push(callTmpl);
    }

    addExprTemplate(exprStr: string, tmpl: CodeTemplate): void {
        const expr = new ExpressionParser(new Reader(exprStr)).parse();
        if (expr instanceof UnresolvedCallExpression
              && expr.func instanceof PropertyAccessExpression
              && expr.func.object instanceof Identifier) {
            const callTmpl = new CallTemplate(expr.func.object.text, 
                expr.func.propertyName, expr.args.map(x => (<Identifier>x).text), tmpl);
            this.addMethod(`${callTmpl.className}.${callTmpl.methodName}@${callTmpl.args.length}`, callTmpl);
        } else if (expr instanceof UnresolvedCallExpression
              && expr.func instanceof Identifier) {
            const callTmpl = new CallTemplate(null, expr.func.text, expr.args.map(x => (<Identifier>x).text), tmpl);
            this.addMethod(`${callTmpl.methodName}@${callTmpl.args.length}`, callTmpl);
        } else if (expr instanceof PropertyAccessExpression && expr.object instanceof Identifier) {
            const fieldTmpl = new FieldAccessTemplate(expr.object.text, expr.propertyName, tmpl);
            this.fields[`${fieldTmpl.className}.${fieldTmpl.fieldName}`] = fieldTmpl;
        } else
            throw new Error(`This expression template format is not supported: '${exprStr}'`);
    }

    expr(expr: IExpression): string {
        const isCallExpr = expr instanceof StaticMethodCallExpression || expr instanceof InstanceMethodCallExpression || expr instanceof GlobalFunctionCallExpression;
        const isFieldRef = expr instanceof StaticFieldReference || expr instanceof StaticPropertyReference ||
            expr instanceof InstanceFieldReference || expr instanceof InstancePropertyReference;

        if (!isCallExpr && !isFieldRef) return null; // quick return

        let codeTmpl: CodeTemplate = null;
        const model: { [name: string]: IVMValue } = {};
        const context = new VMContext(new ObjectValue(model), this);

        model["type"] = new TypeValue(expr.getType());
        for (const name of Object.keys(this.modelGlobals))
            model[name] = this.modelGlobals[name];

        if (isCallExpr) {
            const call = <ICallExpression>expr;
            const parentIntf = call.getParentInterface();
            const methodName = `${parentIntf === null ? "" : `${parentIntf.name}.`}${call.getName()}@${call.args.length}`;
            const callTmpls = this.methods[methodName]||null;
            if (callTmpls === null) return null;

            for (const callTmpl of callTmpls) {
                if (expr instanceof InstanceMethodCallExpression)
                    model["this"] = new ExpressionValue(expr.object);
                for (let i = 0; i < callTmpl.args.length; i++)
                    model[callTmpl.args[i]] = new ExpressionValue(call.args[i]);

                if (callTmpl.template.ifExpr === null ||
                    (<BooleanValue>new ExprVM(context).evaluate(callTmpl.template.ifExpr)).value) {
                        codeTmpl = callTmpl.template;
                        break;
                    }
            }
        } else if (isFieldRef) {
            const cm = <IClassMember><any>(<VariableReference>expr).getVariable();
            const field = this.fields[`${cm.getParentInterface().name}.${cm.name}`]||null;
            if (field === null) return null;

            if (expr instanceof InstanceFieldReference || expr instanceof InstancePropertyReference)
                model["this"] = new ExpressionValue((<IInstanceMemberReference>expr).object);
            codeTmpl = field.template;
        } else
            return null;

        if (codeTmpl === null) return null;

        for (const inc of codeTmpl.includes || [])
            this.generator.addInclude(inc);

        const tmpl = new TemplateParser(codeTmpl.template).parse();
        const result = tmpl.format(context);
        return result;
    }

    stmt(stmt: Statement): string { return null; }
}