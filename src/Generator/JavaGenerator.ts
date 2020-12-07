import { NewExpression, Identifier, TemplateString, ArrayLiteral, CastExpression, BooleanLiteral, StringLiteral, NumericLiteral, CharacterLiteral, PropertyAccessExpression, Expression, ElementAccessExpression, BinaryExpression, UnresolvedCallExpression, ConditionalExpression, InstanceOfExpression, ParenthesizedExpression, RegexLiteral, UnaryExpression, UnaryType, MapLiteral, NullLiteral, AwaitExpression, UnresolvedNewExpression, UnresolvedMethodCallExpression, InstanceMethodCallExpression, NullCoalesceExpression, GlobalFunctionCallExpression, StaticMethodCallExpression, LambdaCallExpression, IMethodCallExpression } from "../One/Ast/Expressions";
import { Statement, ReturnStatement, UnsetStatement, ThrowStatement, ExpressionStatement, VariableDeclaration, BreakStatement, ForeachStatement, IfStatement, WhileStatement, ForStatement, DoStatement, ContinueStatement, TryStatement, Block } from "../One/Ast/Statements";
import { Class, SourceFile, IVariable, Lambda, Interface, IInterface, MethodParameter, IVariableWithInitializer, Visibility, Package, IHasAttributesAndTrivia, Method, ExportScopeRef } from "../One/Ast/Types";
import { VoidType, ClassType, InterfaceType, EnumType, AnyType, LambdaType, NullType, GenericsType, TypeHelper, IInterfaceType } from "../One/Ast/AstTypes";
import { ThisReference, EnumReference, ClassReference, MethodParameterReference, VariableDeclarationReference, ForVariableReference, ForeachVariableReference, SuperReference, StaticFieldReference, StaticPropertyReference, InstanceFieldReference, InstancePropertyReference, EnumMemberReference, CatchVariableReference, GlobalFunctionReference, StaticThisReference, VariableReference } from "../One/Ast/References";
import { GeneratedFile } from "./GeneratedFile";
import { NameUtils } from "./NameUtils";
import { IGenerator } from "./IGenerator";
import { IExpression, IType } from "../One/Ast/Interfaces";
import { IGeneratorPlugin } from "./IGeneratorPlugin";
import { ITransformer } from "../One/ITransformer";
import { ConvertNullCoalesce } from "../One/Transforms/ConvertNullCoalesce";
import { UseDefaultCallArgsExplicitly } from "../One/Transforms/UseDefaultCallArgsExplicitly";
import { ExpressionValue, LambdaValue, TemplateFileGeneratorPlugin, TypeValue } from "./TemplateFileGeneratorPlugin";
import { BooleanValue, IVMValue, StringValue } from "../VM/Values";

export class JavaGenerator implements IGenerator {
    imports = new Set<string>();
    currentClass: IInterface;
    reservedWords: string[] = ["class", "interface", "throws", "package", "throw", "boolean"];
    fieldToMethodHack: string[] = [];
    plugins: IGeneratorPlugin[] = [];

    constructor() {
    }

    getLangName(): string { return "Java"; }
    getExtension(): string { return "java"; }
    getTransforms(): ITransformer[] { return [<ITransformer>new ConvertNullCoalesce(), <ITransformer>new UseDefaultCallArgsExplicitly()]; }
    addInclude(include: string): void { this.imports.add(include); }

    isArray(arrayExpr: Expression) {
        // TODO: InstanceMethodCallExpression is a hack, we should introduce real stream handling
        return arrayExpr instanceof VariableReference && !arrayExpr.getVariable().mutability.mutated ||
            arrayExpr instanceof StaticMethodCallExpression || arrayExpr instanceof InstanceMethodCallExpression;
    }

    arrayStream(arrayExpr: Expression) {
        const isArray = this.isArray(arrayExpr);
        const objR = this.expr(arrayExpr);
        if (isArray)
            this.imports.add("java.util.Arrays");
        return isArray ? `Arrays.stream(${objR})` : `${objR}.stream()`;
    }

    toArray(arrayType: IType, typeArgIdx: number = 0) {
        const type = (<ClassType>arrayType).typeArguments[typeArgIdx];
        return `toArray(${this.type(type)}[]::new)`;
    }

    escape(value: IVMValue): string {
        if (value instanceof ExpressionValue && value.value instanceof RegexLiteral)
            return JSON.stringify(value.value.pattern);
        else if (value instanceof StringValue)
            return JSON.stringify(value.value);
        throw new Error(`Not supported VMValue for escape()`);
    }

    escapeRepl(value: IVMValue): string {
        if (value instanceof ExpressionValue && value.value instanceof StringLiteral)
            return JSON.stringify(value.value.stringValue.replace(/\\/g, "\\\\").replace(/\$/g, "\\$"));
        throw new Error(`Not supported VMValue for escapeRepl()`);
    }

    addPlugin(plugin: IGeneratorPlugin) {
        this.plugins.push(plugin);

        // TODO: hack?
        if (plugin instanceof TemplateFileGeneratorPlugin) {
            plugin.modelGlobals["toStream"] = new LambdaValue(args => new StringValue(this.arrayStream((<ExpressionValue>args[0]).value)));
            plugin.modelGlobals["isArray"] = new LambdaValue(args => new BooleanValue(this.isArray((<ExpressionValue>args[0]).value)));
            plugin.modelGlobals["toArray"] = new LambdaValue(args => new StringValue(this.toArray((<TypeValue>args[0]).type)));
            plugin.modelGlobals["escape"] = new LambdaValue(args => new StringValue(this.escape(args[0])));
            plugin.modelGlobals["escapeRepl"] = new LambdaValue(args => new StringValue(this.escapeRepl(args[0])));
        }
    }
    
    name_(name: string) {
        if (this.reservedWords.includes(name)) name += "_";
        if (this.fieldToMethodHack.includes(name)) name += "()";
        const nameParts = name.split(/-/g);
        for (let i = 1; i < nameParts.length; i++)
            nameParts[i] = nameParts[i][0].toUpperCase() + nameParts[i].substr(1);
        name = nameParts.join('');
        if (name === "_")
            name = "unused";
        return name;
    }

    leading(item: Statement) {
        let result = "";
        if (item.leadingTrivia !== null && item.leadingTrivia.length > 0)
            result += item.leadingTrivia;
        //if (item.attributes !== null)
        //    result += Object.keys(item.attributes).map(x => `// @${x} ${item.attributes[x]}\n`).join("");
        return result;
    }

    preArr(prefix: string, value: string[]) {
        return value.length > 0 ? `${prefix}${value.join(", ")}` : "";
    }

    preIf(prefix: string, condition: boolean) {
        return condition ? prefix : "";
    }

    pre(prefix: string, value: string) {
        return value !== null ? `${prefix}${value}` : "";
    }

    typeArgs(args: string[]): string { return args !== null && args.length > 0 ? `<${args.join(", ")}>` : ""; }
    typeArgs2(args: IType[]): string { return this.typeArgs(args.map(x => this.type(x))); }

    unpackPromise(t: IType): IType {
        return t instanceof ClassType && t.decl === this.currentClass.parentFile.literalTypes.promise.decl ? t.typeArguments[0] : t;
    }

    type(t: IType, mutates = true, isNew = false): string {
        t = this.unpackPromise(t);

        if (t instanceof ClassType || t instanceof InterfaceType) {
            const decl = (<IInterfaceType>t).getDecl();
            if (decl.parentFile.exportScope !== null)
                this.imports.add(this.toImport(decl.parentFile.exportScope) + "." + decl.name);
        }

        if (t instanceof ClassType) {
            const typeArgs = this.typeArgs(t.typeArguments.map(x => this.type(x)));
            if (t.decl.name === "TsString")
                return "String";
            else if (t.decl.name === "TsBoolean")
                return "Boolean";
            else if (t.decl.name === "TsNumber")
                return "Integer";
            else if (t.decl.name === "TsArray") {
                const realType = isNew ? "ArrayList" : "List";
                if (mutates) {
                    this.imports.add(`java.util.${realType}`);
                    return `${realType}<${this.type(t.typeArguments[0])}>`;
                } else
                    return `${this.type(t.typeArguments[0])}[]`;
            } else if (t.decl.name === "Map") {
                const realType = isNew ? "LinkedHashMap" : "Map";
                this.imports.add(`java.util.${realType}`);
                return `${realType}<${this.type(t.typeArguments[0])}, ${this.type(t.typeArguments[1])}>`;
            } else if (t.decl.name === "Set") {
                const realType = isNew ? "LinkedHashSet" : "Set";
                this.imports.add(`java.util.${realType}`);
                return `${realType}<${this.type(t.typeArguments[0])}>`;
            } else if (t.decl.name === "Object") {
                //this.imports.add("System");
                return `Object`;
            } else if (t.decl.name === "TsMap") {
                const realType = isNew ? "LinkedHashMap" : "Map";
                this.imports.add(`java.util.${realType}`);
                return `${realType}<String, ${this.type(t.typeArguments[0])}>`;
            }
            return this.name_(t.decl.name) + typeArgs;
        } else if (t instanceof InterfaceType)
            return `${this.name_(t.decl.name)}${this.typeArgs(t.typeArguments.map(x => this.type(x)))}`;
        else if (t instanceof VoidType)
            return "void";
        else if (t instanceof EnumType)
            return `${this.name_(t.decl.name)}`;
        else if (t instanceof AnyType)
            return `Object`;
        else if (t instanceof NullType)
            return `null`;
        else if (t instanceof GenericsType)
            return `${t.typeVarName}`;
        else if (t instanceof LambdaType) {
            const retType = this.unpackPromise(t.returnType);
            const isFunc = !(retType instanceof VoidType);
            const paramTypes = t.parameters.map(x => this.type(x.type, false));
            if (isFunc)
                paramTypes.push(this.type(retType, false));
            this.imports.add("java.util.function." + (isFunc ? "Function" : "Consumer"));
            return `${isFunc ? "Function" : "Consumer"}<${paramTypes.join(", ")}>`;
        } else if (t === null) {
            return "/* TODO */ object";
        } else {
            debugger;
            return "/* MISSING */";
        }
    }

    isTsArray(type: IType) { return type instanceof ClassType && type.decl.name == "TsArray"; }

    vis(v: Visibility) {
        return v === Visibility.Private ? "private" :
               v === Visibility.Protected ? "protected" :
               v === Visibility.Public ? "public" :
               "/* TODO: not set */public";
    }

    varType(v: IVariable, attr: IHasAttributesAndTrivia) {
        let type: string;
        if (attr !== null && attr.attributes !== null && "java-type" in attr.attributes)
            type = attr.attributes["java-type"];
        else if (v.type instanceof ClassType && v.type.decl.name === "TsArray") {
            if (v.mutability.mutated) {
                this.imports.add("java.util.List");
                type = `List<${this.type(v.type.typeArguments[0])}>`;
            } else {
                type = `${this.type(v.type.typeArguments[0])}[]`;
            }
        } else {
            type = this.type(v.type);
        }
        return type;
    }

    varWoInit(v: IVariable, attr: IHasAttributesAndTrivia) {
        return `${this.varType(v, attr)} ${this.name_(v.name)}`;
    }

    var(v: IVariableWithInitializer, attrs: IHasAttributesAndTrivia) {
        return this.varWoInit(v, attrs) + (v.initializer !== null ? ` = ${this.expr(v.initializer)}` : "");
    }

    exprCall(typeArgs: IType[], args: Expression[]) {
        return this.typeArgs2(typeArgs) + `(${args.map(x => this.expr(x)).join(", ")})`;
    }

    mutateArg(arg: Expression, shouldBeMutable: boolean) {
        if (this.isTsArray(arg.actualType)) {
            const itemType = (<ClassType>arg.actualType).typeArguments[0];
            if (arg instanceof ArrayLiteral && !shouldBeMutable) {
                return arg.items.length === 0 && !this.isTsArray(itemType) ? `new ${this.type(itemType)}[0]` : 
                    `new ${this.type(itemType)}[] { ${arg.items.map(x => this.expr(x)).join(', ')} }`;
            }

            let currentlyMutable = shouldBeMutable;
            if (arg instanceof VariableReference)
                currentlyMutable = arg.getVariable().mutability.mutated;
            else if (arg instanceof InstanceMethodCallExpression || arg instanceof StaticMethodCallExpression)
                currentlyMutable = false;
            
            if (currentlyMutable && !shouldBeMutable)
                return `${this.expr(arg)}.toArray(${this.type(itemType)}[]::new)`;
            else if (!currentlyMutable && shouldBeMutable) {
                this.imports.add("java.util.Arrays");
                this.imports.add("java.util.ArrayList");
                return `new ArrayList<>(Arrays.asList(${this.expr(arg)}))`;
            }
        }
        return this.expr(arg);
    }

    mutatedExpr(expr: Expression, toWhere: Expression) {
        if (toWhere instanceof VariableReference) {
            const v = toWhere.getVariable();
            if (this.isTsArray(v.type))
                return this.mutateArg(expr, v.mutability.mutated);
        }
        return this.expr(expr);
    }

    callParams(args: Expression[], params: MethodParameter[]) {
        const argReprs: string[] = [];
        for (let i = 0; i < args.length; i++)
            argReprs.push(this.isTsArray(params[i].type) ? this.mutateArg(args[i], params[i].mutability.mutated) : this.expr(args[i]));
        return `(${argReprs.join(", ")})`;
    }

    methodCall(expr: IMethodCallExpression) {
        return this.name_(expr.method.name) + this.typeArgs2(expr.typeArgs) + this.callParams(expr.args, expr.method.parameters);
    }

    inferExprNameForType(type: IType): string {
        if (type instanceof ClassType && type.typeArguments.every((x,_) => x instanceof ClassType)) {
            const fullName = type.typeArguments.map(x => (<ClassType>x).decl.name).join('') + type.decl.name;
            return NameUtils.shortName(fullName);
        }
        return null;
    }

    isSetExpr(varRef: VariableReference): boolean {
        return varRef.parentNode instanceof BinaryExpression && varRef.parentNode.left === varRef && ["=", "+=", "-="].includes(varRef.parentNode.operator);
    }

    expr(expr: IExpression): string {
        for (const plugin of this.plugins) {
            const result = plugin.expr(expr);
            if (result !== null)
                return result;
        }

        let res = "UNKNOWN-EXPR";
        if (expr instanceof NewExpression) {
            res = `new ${this.type(expr.cls, true, true)}${this.callParams(expr.args, expr.cls.decl.constructor_ !== null ? expr.cls.decl.constructor_.parameters : [])}`;
        } else if (expr instanceof UnresolvedNewExpression) {
            res = `/* TODO: UnresolvedNewExpression */ new ${this.type(expr.cls)}(${expr.args.map(x => this.expr(x)).join(", ")})`;
        } else if (expr instanceof Identifier) {
            res = `/* TODO: Identifier */ ${expr.text}`;
        } else if (expr instanceof PropertyAccessExpression) {
            res = `/* TODO: PropertyAccessExpression */ ${this.expr(expr.object)}.${expr.propertyName}`;
        } else if (expr instanceof UnresolvedCallExpression) {
            res = `/* TODO: UnresolvedCallExpression */ ${this.expr(expr.func)}${this.exprCall(expr.typeArgs, expr.args)}`;
        } else if (expr instanceof UnresolvedMethodCallExpression) {
            res = `/* TODO: UnresolvedMethodCallExpression */ ${this.expr(expr.object)}.${expr.methodName}${this.exprCall(expr.typeArgs, expr.args)}`;
        } else if (expr instanceof InstanceMethodCallExpression) {
            res = `${this.expr(expr.object)}.${this.methodCall(expr)}`;
        } else if (expr instanceof StaticMethodCallExpression) {
            res = `${this.name_(expr.method.parentInterface.name)}.${this.methodCall(expr)}`;
        } else if (expr instanceof GlobalFunctionCallExpression) {
            res = `Global.${this.name_(expr.func.name)}${this.exprCall([], expr.args)}`;
        } else if (expr instanceof LambdaCallExpression) {
            const resType = this.unpackPromise(expr.actualType);
            res = `${this.expr(expr.method)}.${resType instanceof VoidType ? "accept" : "apply"}(${expr.args.map(x => this.expr(x)).join(", ")})`;
        } else if (expr instanceof BooleanLiteral) {
            res = `${expr.boolValue ? "true" : "false"}`;
        } else if (expr instanceof StringLiteral) { 
            res = `${JSON.stringify(expr.stringValue)}`;
        } else if (expr instanceof NumericLiteral) { 
            res = `${expr.valueAsText}`;
        } else if (expr instanceof CharacterLiteral) { 
            res = `'${expr.charValue}'`;
        } else if (expr instanceof ElementAccessExpression) {
            res = `${this.expr(expr.object)}.get(${this.expr(expr.elementExpr)})`;
        } else if (expr instanceof TemplateString) {
            const parts: string[] = [];
            for (const part of expr.parts) {
                if (part.isLiteral) {
                    let lit = "";
                    for (let i = 0; i < part.literalText.length; i++) {
                        const chr = part.literalText[i];
                        if (chr === '\n')      lit += "\\n";
                        else if (chr === '\r') lit += "\\r";
                        else if (chr === '\t') lit += "\\t";
                        else if (chr === '\\') lit += "\\\\";
                        else if (chr === '"')  lit += '\\"';
                        else {
                            const chrCode = chr.charCodeAt(0);
                            if (32 <= chrCode && chrCode <= 126)
                                lit += chr;
                            else
                                throw new Error(`invalid char in template string (code=${chrCode})`);
                        }
                    }
                    parts.push(`"${lit}"`);
                }
                else {
                    const repr = this.expr(part.expression);
                    parts.push(part.expression instanceof ConditionalExpression ? `(${repr})` : repr);
                }
            }
            res = parts.join(' + ');
        } else if (expr instanceof BinaryExpression) {
            const modifies = ["=", "+=", "-="].includes(expr.operator);
            if (modifies && expr.left instanceof InstanceFieldReference && this.useGetterSetter(expr.left)) {
                res = `${this.expr(expr.left.object)}.set${this.ucFirst(expr.left.field.name)}(${this.mutatedExpr(expr.right, expr.operator === "=" ? expr.left : null)})`;
            } else if (["==", "!="].includes(expr.operator)) {
                const lit = this.currentClass.parentFile.literalTypes;
                const leftType = expr.left.getType();
                const rightType = expr.right.getType();
                const useEquals = TypeHelper.equals(leftType, lit.string) && rightType !== null && TypeHelper.equals(rightType, lit.string);
                if (useEquals) {
                    this.imports.add("io.onelang.std.core.Objects");
                    res = `${expr.operator === "!=" ? "!" : ""}Objects.equals(${this.expr(expr.left)}, ${this.expr(expr.right)})`;
                } else
                    res = `${this.expr(expr.left)} ${expr.operator} ${this.expr(expr.right)}`;
            } else {
                res = `${this.expr(expr.left)} ${expr.operator} ${this.mutatedExpr(expr.right, expr.operator === "=" ? expr.left : null)}`;
            }
        } else if (expr instanceof ArrayLiteral) {
            if (expr.items.length === 0) {
                res = `new ${this.type(expr.actualType, true, true)}()`;
            } else {
                this.imports.add(`java.util.List`);
                this.imports.add(`java.util.ArrayList`);
                res = `new ArrayList<>(List.of(${expr.items.map(x => this.expr(x)).join(', ')}))`;
            }
        } else if (expr instanceof CastExpression) {
            res = `((${this.type(expr.newType)})${this.expr(expr.expression)})`;
        } else if (expr instanceof ConditionalExpression) {
            res = `${this.expr(expr.condition)} ? ${this.expr(expr.whenTrue)} : ${this.mutatedExpr(expr.whenFalse, expr.whenTrue)}`;
        } else if (expr instanceof InstanceOfExpression) {
            res = `${this.expr(expr.expr)} instanceof ${this.type(expr.checkType)}`;
        } else if (expr instanceof ParenthesizedExpression) {
            res = `(${this.expr(expr.expression)})`;
        } else if (expr instanceof RegexLiteral) {
            this.imports.add(`io.onelang.std.core.RegExp`);
            res = `new RegExp(${JSON.stringify(expr.pattern)})`;
        } else if (expr instanceof Lambda) {
            let body: string;
            if (expr.body.statements.length === 1 && expr.body.statements[0] instanceof ReturnStatement)
                body = " " + this.expr((<ReturnStatement>expr.body.statements[0]).expression);
            else
                body = this.block(expr.body, false);

            const params = expr.parameters.map(x => this.name_(x.name));

            res = `${params.length === 1 ? params[0] : `(${params.join(", ")})`} ->${body}`;
        } else if (expr instanceof UnaryExpression && expr.unaryType === UnaryType.Prefix) {
            res = `${expr.operator}${this.expr(expr.operand)}`;
        } else if (expr instanceof UnaryExpression && expr.unaryType === UnaryType.Postfix) {
            res = `${this.expr(expr.operand)}${expr.operator}`;
        } else if (expr instanceof MapLiteral) {
            if (expr.items.length > 10)
                throw new Error("MapLiteral is only supported with maximum of 10 items");
            if (expr.items.length === 0) {
                res = `new ${this.type(expr.actualType, true, true)}()`;
            } else {
                this.imports.add(`java.util.Map`);
                const repr = expr.items.map(item => `${JSON.stringify(item.key)}, ${this.expr(item.value)}`).join(", ");
                res = `Map.of(${repr})`;
            }
        } else if (expr instanceof NullLiteral) {
            res = `null`;
        } else if (expr instanceof AwaitExpression) {
            res = `${this.expr(expr.expr)}`;
        } else if (expr instanceof ThisReference) {
            res = `this`;
        } else if (expr instanceof StaticThisReference) {
            res = `${this.currentClass.name}`;
        } else if (expr instanceof EnumReference) {
            res = `${this.name_(expr.decl.name)}`;
        } else if (expr instanceof ClassReference) {
            res = `${this.name_(expr.decl.name)}`;
        } else if (expr instanceof MethodParameterReference) {
            res = `${this.name_(expr.decl.name)}`;
        } else if (expr instanceof VariableDeclarationReference) {
            res = `${this.name_(expr.decl.name)}`;
        } else if (expr instanceof ForVariableReference) {
            res = `${this.name_(expr.decl.name)}`;
        } else if (expr instanceof ForeachVariableReference) {
            res = `${this.name_(expr.decl.name)}`;
        } else if (expr instanceof CatchVariableReference) {
            res = `${this.name_(expr.decl.name)}`;
        } else if (expr instanceof GlobalFunctionReference) {
            res = `${this.name_(expr.decl.name)}`;
        } else if (expr instanceof SuperReference) {
            res = `super`;
        } else if (expr instanceof StaticFieldReference) {
            res = `${this.name_(expr.decl.parentInterface.name)}.${this.name_(expr.decl.name)}`;
        } else if (expr instanceof StaticPropertyReference) {
            res = `${this.name_(expr.decl.parentClass.name)}.${this.name_(expr.decl.name)}`;
        } else if (expr instanceof InstanceFieldReference) {
            // TODO: unified handling of field -> property conversion?
            if (this.useGetterSetter(expr))
                res = `${this.expr(expr.object)}.get${this.ucFirst(expr.field.name)}()`;
            else
                res = `${this.expr(expr.object)}.${this.name_(expr.field.name)}`;
        } else if (expr instanceof InstancePropertyReference) {
            res = `${this.expr(expr.object)}.${this.isSetExpr(expr) ? "set" : "get"}${this.ucFirst(expr.property.name)}()`;
        } else if (expr instanceof EnumMemberReference) {
            res = `${this.name_(expr.decl.parentEnum.name)}.${this.name_(expr.decl.name)}`;
        } else if (expr instanceof NullCoalesceExpression) {
            res = `${this.expr(expr.defaultExpr)} != null ? ${this.expr(expr.defaultExpr)} : ${this.mutatedExpr(expr.exprIfNull, expr.defaultExpr)}`;
        } else debugger;
        return res;
    }

    useGetterSetter(fieldRef: InstanceFieldReference): boolean {
        return fieldRef.object.actualType instanceof InterfaceType || (fieldRef.field.interfaceDeclarations !== null && fieldRef.field.interfaceDeclarations.length > 0);
    }

    block(block: Block, allowOneLiner = true): string {
        const stmtLen = block.statements.length;
        return stmtLen === 0 ? " { }" : allowOneLiner && stmtLen === 1 && !(block.statements[0] instanceof IfStatement) && !(block.statements[0] instanceof VariableDeclaration) ? 
            `\n${this.pad(this.rawBlock(block))}` : ` {\n${this.pad(this.rawBlock(block))}\n}`;
    }

    stmtDefault(stmt: Statement): string {
        let res = "UNKNOWN-STATEMENT";
        if (stmt instanceof BreakStatement) {
            res = "break;";
        } else if (stmt instanceof ReturnStatement) {
            res = stmt.expression === null ? "return;" : `return ${this.mutateArg(stmt.expression, false)};`;
        } else if (stmt instanceof UnsetStatement) {
            res = `/* unset ${this.expr(stmt.expression)}; */`;
        } else if (stmt instanceof ThrowStatement) {
            res = `throw ${this.expr(stmt.expression)};`;
        } else if (stmt instanceof ExpressionStatement) {
            res = `${this.expr(stmt.expression)};`;
        } else if (stmt instanceof VariableDeclaration) {
            if (stmt.initializer instanceof NullLiteral)
                res = `${this.type(stmt.type, stmt.mutability.mutated)} ${this.name_(stmt.name)} = null;`;
            else if (stmt.initializer !== null)
                res = `var ${this.name_(stmt.name)} = ${this.mutateArg(stmt.initializer, stmt.mutability.mutated)};`;
            else
                res = `${this.type(stmt.type)} ${this.name_(stmt.name)};`;
        } else if (stmt instanceof ForeachStatement) {
            res = `for (var ${this.name_(stmt.itemVar.name)} : ${this.expr(stmt.items)})` + this.block(stmt.body);
        } else if (stmt instanceof IfStatement) {
            const elseIf = stmt.else_ !== null && stmt.else_.statements.length === 1 && stmt.else_.statements[0] instanceof IfStatement;
            res = `if (${this.expr(stmt.condition)})${this.block(stmt.then)}`;
            res += (elseIf ? `\nelse ${this.stmt(stmt.else_.statements[0])}` : "") +
                (!elseIf && stmt.else_ !== null ? `\nelse` + this.block(stmt.else_) : "");
        } else if (stmt instanceof WhileStatement) {
            res = `while (${this.expr(stmt.condition)})` + this.block(stmt.body);
        } else if (stmt instanceof ForStatement) {
            res = `for (${stmt.itemVar !== null ? this.var(stmt.itemVar, null) : ""}; ${this.expr(stmt.condition)}; ${this.expr(stmt.incrementor)})` + this.block(stmt.body);
        } else if (stmt instanceof DoStatement) {
            res = `do${this.block(stmt.body)} while (${this.expr(stmt.condition)});`;
        } else if (stmt instanceof TryStatement) {
            res = "try" + this.block(stmt.tryBody, false);
            if (stmt.catchBody !== null) {
                //this.imports.add("System");
                res += ` catch (Exception ${this.name_(stmt.catchVar.name)}) ${this.block(stmt.catchBody, false)}`;
            }
            if (stmt.finallyBody !== null)
                res += "finally" + this.block(stmt.finallyBody);
        } else if (stmt instanceof ContinueStatement) {
            res = `continue;`;
        } else debugger;
        return res;
    }

    stmt(stmt: Statement): string {
        let res: string = null;

        if (stmt.attributes !== null && "java-import" in stmt.attributes)
            this.imports.add(stmt.attributes["java-import"]);

        if (stmt.attributes !== null && "java" in stmt.attributes) {
            res = stmt.attributes["java"];
        } else {
            for (const plugin of this.plugins) {
                res = plugin.stmt(stmt);
                if (res !== null) break;
            }

            if (res === null)
                res = this.stmtDefault(stmt);
        }

        return this.leading(stmt) + res;
    }

    stmts(stmts: Statement[]): string { return stmts.map(stmt => this.stmt(stmt)).join("\n"); }
    rawBlock(block: Block): string { return this.stmts(block.statements); }

    methodGen(prefix: string, params: MethodParameter[], body: string): string {
        return `${prefix}(${params.map(p => this.varWoInit(p, p)).join(", ")})${body}`;
    }

    method(method: Method, isCls: boolean): string {
        // TODO: final
        const prefix = (isCls ? this.vis(method.visibility) + " " : "") +
            this.preIf("static ", method.isStatic) +
            //this.preIf("virtual ", method.overrides === null && method.overriddenBy.length === 0) + 
            //this.preIf("override ", method.overrides !== null) +
            //this.preIf("async ", method.async) +
            this.preIf("/* throws */ ", method.throws) +
            (method.typeArguments.length > 0 ? `<${method.typeArguments.join(', ')}> ` : "") +
            `${this.type(method.returns, false)} ` +
            this.name_(method.name);

        return this.methodGen(prefix, method.parameters,
            method.body === null ? ";" : ` {\n${this.pad(this.stmts(method.body.statements))}\n}`);
    }

    class(cls: Class) {
        this.currentClass = cls;
        const resList: string[] = [];

        const staticConstructorStmts: Statement[] = [];
        const complexFieldInits: Statement[] = [];
        const fieldReprs: string[] = [];
        const propReprs: string[] = [];
        for (const field of cls.fields) {
            const isInitializerComplex = field.initializer !== null && 
                !(field.initializer instanceof StringLiteral) && 
                !(field.initializer instanceof BooleanLiteral) && 
                !(field.initializer instanceof NumericLiteral);

            const prefix = `${this.vis(field.visibility)} ${this.preIf("static ", field.isStatic)}`;
            if (field.interfaceDeclarations.length > 0) {
                const varType = this.varType(field, field);
                const name = this.name_(field.name);
                const pname = this.ucFirst(field.name);
                const setToFalse = TypeHelper.equals(field.type, this.currentClass.parentFile.literalTypes.boolean);
                propReprs.push(
                    `${varType} ${name}${setToFalse ? " = false" : field.initializer !== null ? ` = ${this.expr(field.initializer)}` : ""};\n` +
                    `${prefix}${varType} get${pname}() { return this.${name}; }\n` +
                    `${prefix}void set${pname}(${varType} value) { this.${name} = value; }`);
            } else if (isInitializerComplex) {
                if (field.isStatic)
                    staticConstructorStmts.push(new ExpressionStatement(new BinaryExpression(new StaticFieldReference(field), "=", field.initializer)));
                else
                    complexFieldInits.push(new ExpressionStatement(new BinaryExpression(new InstanceFieldReference(new ThisReference(cls), field), "=", field.initializer)));
                
                fieldReprs.push(`${prefix}${this.varWoInit(field, field)};`);
            } else
                fieldReprs.push(`${prefix}${this.var(field, field)};`);
        }
        resList.push(fieldReprs.join("\n"));
        resList.push(propReprs.join("\n\n"));

        for (const prop of cls.properties) {
            const prefix = `${this.vis(prop.visibility)} ${this.preIf("static ", prop.isStatic)}`;
            if (prop.getter !== null)
                resList.push(`${prefix}${this.type(prop.type)} get${this.ucFirst(prop.name)}()${this.block(prop.getter, false)}`);

            if (prop.setter !== null)
                resList.push(`${prefix}void set${this.ucFirst(prop.name)}(${this.type(prop.type)} value)${this.block(prop.setter, false)}`);
        }

        if (staticConstructorStmts.length > 0)
            resList.push(`static {\n${this.pad(this.stmts(staticConstructorStmts))}\n}`);

        if (cls.constructor_ !== null) {
            const constrFieldInits: Statement[] = [];
            for (const field of cls.fields.filter(x => x.constructorParam !== null)) {
                const fieldRef = new InstanceFieldReference(new ThisReference(cls), field);
                const mpRef = new MethodParameterReference(field.constructorParam);
                // TODO: decide what to do with "after-TypeEngine" transformations
                mpRef.setActualType(field.type, false, false);
                constrFieldInits.push(new ExpressionStatement(new BinaryExpression(fieldRef, "=", mpRef)));
            }

            const superCall = cls.constructor_.superCallArgs !== null ? `super(${cls.constructor_.superCallArgs.map(x => this.expr(x)).join(", ")});\n` : "";

            // TODO: super calls
            resList.push(this.methodGen(
                "public " + this.preIf("/* throws */ ", cls.constructor_.throws) + this.name_(cls.name),
                cls.constructor_.parameters,
                `\n{\n${this.pad(superCall + this.stmts(constrFieldInits.concat(complexFieldInits).concat(cls.constructor_.body.statements)))}\n}`));
        } else if (complexFieldInits.length > 0)
            resList.push(`public ${this.name_(cls.name)}()\n{\n${this.pad(this.stmts(complexFieldInits))}\n}`);

        const methods: string[] = [];
        for (const method of cls.methods) {
            if (method.body === null) continue; // declaration only
            methods.push(this.method(method, true));
        }
        resList.push(methods.join("\n\n"));
        return this.pad(resList.filter(x => x !== "").join("\n\n"));
    }

    ucFirst(str: string): string { return str[0].toUpperCase() + str.substr(1); }

    interface(intf: Interface) {
        this.currentClass = intf;
        
        const resList: string[] = [];
        for (const field of intf.fields) {
            const varType = this.varType(field, field);
            const name = this.ucFirst(field.name);
            resList.push(`${varType} get${name}();\nvoid set${name}(${varType} value);`);
        }

        resList.push(intf.methods.map(method => this.method(method, false)).join("\n"));
        return this.pad(resList.filter(x => x !== "").join("\n\n"));
    }

    pad(str: string): string { return str.split(/\n/g).map(x => `    ${x}`).join('\n'); }

    pathToNs(path: string): string {
        // Generator/ExprLang/ExprLangAst.ts -> Generator.ExprLang
        const parts = path.split(/\//g);
        parts.pop();
        return parts.join('.');
    }

    importsHead(): string {
        const imports: string[] = [];
        for (const imp of this.imports.values())
            imports.push(imp);
        this.imports = new Set<string>();
        return imports.length === 0 ? "" : imports.map(x => `import ${x};`).join("\n") + "\n\n";
    }

    toImport(scope: ExportScopeRef): string {
        // TODO: hack
        if (scope.scopeName === "index") {
            const name = scope.packageName.split(/-/g)[0].replace(/One\./g, "").toLowerCase();
            return `io.onelang.std.${name}`;
        }
        return `${scope.packageName}.${scope.scopeName.replace(/\//g, ".")}`;
    }

    generate(pkg: Package): GeneratedFile[] {
        const result: GeneratedFile[] = [];
        for (const path of Object.keys(pkg.files)) {
            const file = pkg.files[path];
            const packagePath = `${pkg.name}/${file.sourcePath.path}`;
            const dstDir = `src/main/java/${packagePath}`;
            const packageName = packagePath.replace(/\//g, ".");
            
            const imports = new Set<string>();
            for (const impList of file.imports) {
                const impPkg = this.toImport(impList.exportScope);
                for (const imp of impList.imports)
                    imports.add(`${impPkg}.${imp.name}`);
            }

            const headImports = Array.from(imports.values()).map(x => `import ${x};`).join("\n");
            const head = `package ${packageName};\n\n${headImports}\n\n`;

            for (const enum_ of file.enums) {
                result.push(new GeneratedFile(`${dstDir}/${enum_.name}.java`, 
                    `${head}public enum ${this.name_(enum_.name)} { ${enum_.values.map(x => this.name_(x.name)).join(", ")} }`));
            }

            for (const intf of file.interfaces) {
                const res = `public interface ${this.name_(intf.name)}${this.typeArgs(intf.typeArguments)}`+
                    `${this.preArr(" extends ", intf.baseInterfaces.map(x => this.type(x)))} {\n${this.interface(intf)}\n}`;
                result.push(new GeneratedFile(`${dstDir}/${intf.name}.java`, `${head}${this.importsHead()}${res}`));
            }

            for (const cls of file.classes) {
                const res = `public class ${this.name_(cls.name)}${this.typeArgs(cls.typeArguments)}` +
                    (cls.baseClass !== null ? ` extends ${this.type(cls.baseClass)}` : "") +
                    this.preArr(" implements ", cls.baseInterfaces.map(x => this.type(x))) +
                    ` {\n${this.class(cls)}\n}`;
                result.push(new GeneratedFile(`${dstDir}/${cls.name}.java`, `${head}${this.importsHead()}${res}`));
            }
        }
        return result;
    }
}