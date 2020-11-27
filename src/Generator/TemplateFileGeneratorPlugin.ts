import { OneYaml, ValueType, YamlValue } from "One.Yaml-v0.1";
import { ExpressionParser } from "../Parsers/Common/ExpressionParser";
import { Expression, GlobalFunctionCallExpression, ICallExpression, Identifier, IMethodCallExpression, InstanceMethodCallExpression, PropertyAccessExpression, StaticMethodCallExpression, UnresolvedCallExpression } from "../One/Ast/Expressions";
import { IExpression, IType } from "../One/Ast/Interfaces";
import { Statement } from "../One/Ast/Statements";
import { IGeneratorPlugin } from "./IGeneratorPlugin";
import { Reader } from "../Parsers/Common/Reader";
import { ICallableValue, IVMValue, ObjectValue } from "../VM/Values";
import { IInstanceMemberReference, InstanceFieldReference, InstancePropertyReference, StaticFieldReference, StaticPropertyReference, VariableReference } from "../One/Ast/References";
import { IClassMember } from "../One/Ast/Types";
import { TemplateParser } from "../Template/TemplateParser";
import { IGenerator } from "./IGenerator";
import { IVMHooks, VMContext } from "../VM/ExprVM";

export class CodeTemplate {
    constructor(public template: string, public includes: string[]) { }
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
    methods: { [name: string]: CallTemplate } = {};
    fields: { [name: string]: FieldAccessTemplate } = {};
    modelGlobals: { [name: string]: IVMValue } = {};

    constructor(public generator: IGenerator, templateYaml: string) {
        const root = OneYaml.load(templateYaml);
        const exprDict = root.dict("expressions");

        for (const exprStr of Object.keys(exprDict)) {
            const val = exprDict[exprStr];
            const tmpl = val.type() === ValueType.String ? 
                new CodeTemplate(val.asStr(), []) : 
                new CodeTemplate(val.str("template"), val.strArr("includes"));

            this.addExprTemplate(exprStr, tmpl);
        }
    }

    stringifyValue(value: IVMValue): string {
        if (value instanceof ExpressionValue) {
            const result = this.generator.expr(value.value);
            return result;
        }
        return null;
    }

    addExprTemplate(exprStr: string, tmpl: CodeTemplate): void {
        const expr = new ExpressionParser(new Reader(exprStr)).parse();
        if (expr instanceof UnresolvedCallExpression
              && expr.func instanceof PropertyAccessExpression
              && expr.func.object instanceof Identifier) {
            const callTmpl = new CallTemplate(expr.func.object.text, 
                expr.func.propertyName, expr.args.map(x => (<Identifier>x).text), tmpl);
            this.methods[`${callTmpl.className}.${callTmpl.methodName}@${callTmpl.args.length}`] = callTmpl;
        } else if (expr instanceof UnresolvedCallExpression
              && expr.func instanceof Identifier) {
            const callTmpl = new CallTemplate(null, expr.func.text, expr.args.map(x => (<Identifier>x).text), tmpl);
            this.methods[`${callTmpl.methodName}@${callTmpl.args.length}`] = callTmpl;
        } else if (expr instanceof PropertyAccessExpression && expr.object instanceof Identifier) {
            const fieldTmpl = new FieldAccessTemplate(expr.object.text, expr.propertyName, tmpl);
            this.fields[`${fieldTmpl.className}.${fieldTmpl.fieldName}`] = fieldTmpl;
        } else
            throw new Error(`This expression template format is not supported: '${exprStr}'`);
    }

    expr(expr: IExpression): string {
        var codeTmpl: CodeTemplate = null;
        var model: { [name: string]: IVMValue } = {};

        if (expr instanceof StaticMethodCallExpression || expr instanceof InstanceMethodCallExpression || expr instanceof GlobalFunctionCallExpression) {
            const call = <ICallExpression>expr;
            const parentIntf = call.getParentInterface();
            const methodName = `${parentIntf === null ? "" : `${parentIntf.name}.`}${call.getName()}@${call.args.length}`;
            const callTmpl = this.methods[methodName]||null;
            if (callTmpl === null) return null;

            if (expr instanceof InstanceMethodCallExpression)
                model["this"] = new ExpressionValue(expr.object);
            for (let i = 0; i < callTmpl.args.length; i++)
                model[callTmpl.args[i]] = new ExpressionValue(call.args[i]);
            codeTmpl = callTmpl.template;
        } else if (expr instanceof StaticFieldReference || expr instanceof StaticPropertyReference ||
                expr instanceof InstanceFieldReference || expr instanceof InstancePropertyReference) {
            const cm = <IClassMember><any>(<VariableReference>expr).getVariable();
            const field = this.fields[`${cm.getParentInterface().name}.${cm.name}`]||null;
            if (field === null) return null;

            if (expr instanceof InstanceFieldReference || expr instanceof InstancePropertyReference)
                model["this"] = new ExpressionValue((<IInstanceMemberReference>expr).object);
            codeTmpl = field.template;
        } else
            return null;

        model["type"] = new TypeValue(expr.getType());
        for (const name of Object.keys(this.modelGlobals))
            model[name] = this.modelGlobals[name];

        for (const inc of codeTmpl.includes || [])
            this.generator.addInclude(inc);

        const tmpl = new TemplateParser(codeTmpl.template).parse();
        const result = tmpl.format(new VMContext(new ObjectValue(model), this));
        return result;
    }

    stmt(stmt: Statement): string { return null; }
}