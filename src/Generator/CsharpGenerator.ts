import { NewExpression, Identifier, TemplateString, ArrayLiteral, CastExpression, BooleanLiteral, StringLiteral, NumericLiteral, CharacterLiteral, PropertyAccessExpression, Expression, ElementAccessExpression, BinaryExpression, UnresolvedCallExpression, ConditionalExpression, InstanceOfExpression, ParenthesizedExpression, RegexLiteral, UnaryExpression, UnaryType, MapLiteral, NullLiteral, AwaitExpression, UnresolvedNewExpression, UnresolvedMethodCallExpression, InstanceMethodCallExpression, NullCoalesceExpression, GlobalFunctionCallExpression, StaticMethodCallExpression, LambdaCallExpression, IExpression } from "../One/Ast/Expressions";
import { Statement, ReturnStatement, UnsetStatement, ThrowStatement, ExpressionStatement, VariableDeclaration, BreakStatement, ForeachStatement, IfStatement, WhileStatement, ForStatement, DoStatement, ContinueStatement, ForVariable, TryStatement } from "../One/Ast/Statements";
import { Method, Block, Class, IClassMember, SourceFile, IMethodBase, Constructor, IVariable, Lambda, IImportable, UnresolvedImport, Interface, Enum, IInterface, Field, Property, MethodParameter, IVariableWithInitializer, Visibility, IAstNode, GlobalFunction, Package, SourcePath } from "../One/Ast/Types";
import { Type, VoidType, ClassType, InterfaceType, EnumType, AnyType, LambdaType, NullType, GenericsType } from "../One/Ast/AstTypes";
import { ThisReference, EnumReference, ClassReference, MethodParameterReference, VariableDeclarationReference, ForVariableReference, ForeachVariableReference, SuperReference, StaticFieldReference, StaticPropertyReference, InstanceFieldReference, InstancePropertyReference, EnumMemberReference, CatchVariableReference, GlobalFunctionReference, StaticThisReference, Reference } from "../One/Ast/References";

export class GeneratedFile {
    constructor(public path: string, public content: string) { }
}

export class CsharpGenerator {
    static usings = new Set<string>(); // TODO: make instance
    static currentClass: IInterface; // TODO: make instance
    static reservedWords = ["object", "else", "operator", "class", "enum", "void", "string", "implicit", "Type", "Enum", "params", "using", "throw", "ref", "base", "virtual", "interface"];
    static fieldToMethodHack = ["length"];

    static name_(name: string) {
        if (this.reservedWords.includes(name)) name += "_";
        if (this.fieldToMethodHack.includes(name)) name += "()";
        name = name.replace(/-/g, '');
        return name;
    }

    static leading(item: Statement) {
        let result = "";
        if (item.leadingTrivia !== null && item.leadingTrivia.length > 0)
            result += item.leadingTrivia;
        if (item.attributes !== null)
            result += Object.keys(item.attributes).map(x => `/// {ATTR} name="${x}", value=${JSON.stringify(item.attributes[x])}\n`).join("");
        return result;
    }

    static preArr(prefix: string, value: string[]) {
        return value.length > 0 ? `${prefix}${value.join(", ")}` : "";
    }

    static preIf(prefix: string, condition: boolean) {
        return condition ? prefix : "";
    }

    static pre(prefix: string, value: string) {
        return value !== null ? `${prefix}${value}` : "";
    }

    static typeArgs(args: string[]): string { return args !== null && args.length > 0 ? `<${args.join(", ")}>` : ""; }
    
    static type(t: Type): string {
        if (t instanceof ClassType) {
            const typeArgs = this.typeArgs(t.typeArguments.map(x => this.type(x)));
            if (t.decl.name === "TsString")
                return "string";
            else if (t.decl.name === "TsBoolean")
                return "bool";
            else if (t.decl.name === "TsNumber")
                return "int";
            else if (t.decl.name === "TsArray")
                return `${this.type(t.typeArguments[0])}[]`;
            else if (t.decl.name === "Promise") {
                this.usings.add("System.Threading.Tasks");
                return `Task${typeArgs}`;
            } else if (t.decl.name === "Object") {
                this.usings.add("System");
                return `object`;
            } else if (t.decl.name === "TsMap") {
                this.usings.add("System.Collections.Generic");
                return `Dictionary<string, ${this.type(t.typeArguments[0])}>`;
            }
            return this.name_(t.decl.name) + typeArgs;
        } else if (t instanceof InterfaceType)
            return `${this.name_(t.decl.name)}${this.typeArgs(t.typeArguments.map(x => this.type(x)))}`;
        else if (t instanceof VoidType)
            return "void";
        else if (t instanceof EnumType)
            return `${this.name_(t.decl.name)}`;
        else if (t instanceof AnyType)
            return `object`;
        else if (t instanceof NullType)
            return `null`;
        else if (t instanceof GenericsType)
            return `${t.typeVarName}`;
        else if (t instanceof LambdaType) {
            const isFunc = !(t.returnType instanceof VoidType);
            return `${isFunc ? "Func" : "Action"}<${t.parameters.map(x => this.type(x.type)).join(", ")}${isFunc ? this.type(t.returnType) : ""}>`;
        } else if (t === null) {
            return "/* TODO */ object";
        } else {
            debugger;
            return "/* MISSING */";
        }
    }

    static vis(v: Visibility) {
        return v === Visibility.Private ? "private" :
               v === Visibility.Protected ? "protected" :
               v === Visibility.Public ? "public" :
               "/* TODO: not set */public";
    }

    static varWoInit(v: IVariable) { return `${this.type(v.type)} ${this.name_(v.name)}`; }
    static var(v: IVariableWithInitializer) { return `${this.varWoInit(v)}${v.initializer !== null ? ` = ${this.expr(v.initializer)}` : ""}`; }

    static expr(expr: IExpression): string {
        let res = "UNKNOWN-EXPR";
        if (expr instanceof NewExpression) {
            res = `new ${this.type(expr.cls)}(${expr.args.map(x => this.expr(x)).join(", ")})`;
        } else if (expr instanceof UnresolvedNewExpression) {
            res = `/* TODO: UnresolvedNewExpression */ new ${this.type(expr.cls)}(${expr.args.map(x => this.expr(x)).join(", ")})`;
        } else if (expr instanceof Identifier) {
            res = `/* TODO: Identifier */ ${expr.text}`;
        } else if (expr instanceof PropertyAccessExpression) {
            res = `/* TODO: PropertyAccessExpression */ ${this.expr(expr.object)}.${expr.propertyName}`;
        } else if (expr instanceof UnresolvedCallExpression) {
            const typeArgs = expr.typeArgs.length > 0 ? `<${expr.typeArgs.map(x => this.type(x)).join(", ")}>` : "";
            res = `/* TODO: UnresolvedCallExpression */ ${this.expr(expr.func)}${typeArgs}(${expr.args.map(x => this.expr(x)).join(", ")})`;
        } else if (expr instanceof UnresolvedMethodCallExpression) {
            const typeArgs = expr.typeArgs.length > 0 ? `<${expr.typeArgs.map(x => this.type(x)).join(", ")}>` : "";
            res = `/* TODO: UnresolvedMethodCallExpression */ ${this.expr(expr.object)}.${expr.methodName}${typeArgs}(${expr.args.map(x => this.expr(x)).join(", ")})`;
        } else if (expr instanceof InstanceMethodCallExpression) {
            const typeArgs = expr.typeArgs.length > 0 ? `<${expr.typeArgs.map(x => this.type(x)).join(", ")}>` : "";
            //if (expr.object instanceof ThisReference) debugger;
            res = `${this.expr(expr.object)}.${this.name_(expr.method.name)}${typeArgs}(${expr.args.map(x => this.expr(x)).join(", ")})`;
        } else if (expr instanceof StaticMethodCallExpression) {
            const typeArgs = expr.typeArgs.length > 0 ? `<${expr.typeArgs.map(x => this.type(x)).join(", ")}>` : "";
            const intfPrefix = `${this.name_(expr.method.parentInterface.name)}.`;
            res = `${intfPrefix}${this.name_(expr.method.name)}${typeArgs}(${expr.args.map(x => this.expr(x)).join(", ")})`;
        } else if (expr instanceof GlobalFunctionCallExpression) {
            res = `Global.${this.name_(expr.func.name)}(${expr.args.map(x => this.expr(x)).join(", ")})`;
        } else if (expr instanceof LambdaCallExpression) {
            res = `${this.expr(expr.method)}(${expr.args.map(x => this.expr(x)).join(", ")})`;
        } else if (expr instanceof BooleanLiteral) {
            res = `${expr.boolValue}`;
        } else if (expr instanceof StringLiteral) { 
            res = `${JSON.stringify(expr.stringValue)}`;
        } else if (expr instanceof NumericLiteral) { 
            res = `${expr.valueAsText}`;
        } else if (expr instanceof CharacterLiteral) { 
            res = `'${expr.charValue}'`;
        } else if (expr instanceof ElementAccessExpression) {
            res = `${this.expr(expr.object)}[${this.expr(expr.elementExpr)}]`;
        } else if (expr instanceof TemplateString) {
            const parts: string[] = [];
            for (const part of expr.parts) {
                if (part.isLiteral)
                    parts.push(part.literalText.replace(/\\/g, `\\\\`).replace(/"/g, `\\"`).replace(/{/g, "{{").replace(/}/g, "}}"));
                else {
                    const repr = this.expr(part.expression);
                    parts.push(part.expression instanceof ConditionalExpression ? `{(${repr})}` : `{${repr}}`);
                }
            }
            res = `$"${parts.join('')}"`;
        } else if (expr instanceof BinaryExpression) {
            res = `${this.expr(expr.left)} ${expr.operator} ${this.expr(expr.right)}`;
        } else if (expr instanceof ArrayLiteral) {
            if (expr.items.length === 0) {
                const arrayType = (<ClassType>expr.actualType).typeArguments[0];
                if (arrayType instanceof ClassType && arrayType.decl.name === "TsArray")
                    res = `new ${this.type(expr.actualType)} { }`;
                else
                    res = `new ${this.type(arrayType)}[0]`;
            } else
                res = `new[] { ${expr.items.map(x => this.expr(x)).join(', ')} }`;
        } else if (expr instanceof CastExpression) {
            res = `((${this.type(expr.newType)})${this.expr(expr.expression)})`;
        } else if (expr instanceof ConditionalExpression) {
            res = `${this.expr(expr.condition)} ? ${this.expr(expr.whenTrue)} : ${this.expr(expr.whenFalse)}`;
        } else if (expr instanceof InstanceOfExpression) {
            res = `${this.expr(expr.expr)} is ${this.type(expr.checkType)}`;
        } else if (expr instanceof ParenthesizedExpression) {
            res = `(${this.expr(expr.expression)})`;
        } else if (expr instanceof RegexLiteral) {
            res = `new RegExp(${JSON.stringify(expr.pattern)})`;
        } else if (expr instanceof Lambda) {
            res = `(${expr.parameters.map(x => `${this.type(x.type)} ${this.name_(x.name)}`).join(", ")}) => { ${this.rawBlock(expr.body)} }`;
        } else if (expr instanceof UnaryExpression && expr.unaryType === UnaryType.Prefix) {
            res = `${expr.operator}${this.expr(expr.operand)}`;
        } else if (expr instanceof UnaryExpression && expr.unaryType === UnaryType.Postfix) {
            res = `${this.expr(expr.operand)}${expr.operator}`;
        } else if (expr instanceof MapLiteral) {
            const repr = expr.items.map(item => `[${JSON.stringify(item.key)}] = ${this.expr(item.value)}`).join(",\n");
            res = `new ${this.type(expr.actualType)} ` + (repr === "" ? "{}" : repr.includes("\n") ? `{\n${this.pad(repr)}\n}` : `{ ${repr} }`);
        } else if (expr instanceof NullLiteral) {
            res = `null`;
        } else if (expr instanceof AwaitExpression) {
            res = `await ${this.expr(expr.expr)}`;
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
            res = `base`;
        } else if (expr instanceof StaticFieldReference) {
            res = `${this.name_(expr.decl.parentInterface.name)}.${this.name_(expr.decl.name)}`;
        } else if (expr instanceof StaticPropertyReference) {
            res = `${this.name_(expr.decl.parentClass.name)}.${this.name_(expr.decl.name)}`;
        } else if (expr instanceof InstanceFieldReference) {
            res = `${this.expr(expr.object)}.${this.name_(expr.field.name)}`;
        } else if (expr instanceof InstancePropertyReference) {
            res = `${this.expr(expr.object)}.${this.name_(expr.property.name)}`;
        } else if (expr instanceof EnumMemberReference) {
            res = `${this.name_(expr.decl.parentEnum.name)}.${this.name_(expr.decl.name)}`;
        } else if (expr instanceof NullCoalesceExpression) {
            res = `${this.expr(expr.defaultExpr)} ?? ${this.expr(expr.exprIfNull)}`;
        } else debugger;
        return res;
    }

    static block(block: Block, allowOneLiner = true): string {
        const stmtLen = block.statements.length;
        return stmtLen === 0 ? " { }" : allowOneLiner && stmtLen === 1 ? `\n${this.pad(this.rawBlock(block))}` : ` {\n${this.pad(this.rawBlock(block))}\n}`;
    }

    static stmt(stmt: Statement): string {
        let res = "UNKNOWN-STATEMENT";
        if (stmt instanceof BreakStatement) {
            res = "break;";
        } else if (stmt instanceof ReturnStatement) {
            res = stmt.expression === null ? "return;" : `return ${this.expr(stmt.expression)};`;
        } else if (stmt instanceof UnsetStatement) {
            res = `/* unset ${this.expr(stmt.expression)}; */`;
        } else if (stmt instanceof ThrowStatement) {
            res = `throw ${this.expr(stmt.expression)};`;
        } else if (stmt instanceof ExpressionStatement) {
            res = `${this.expr(stmt.expression)};`;
        } else if (stmt instanceof VariableDeclaration) {
            if (stmt.initializer instanceof NullLiteral)
                res = `${this.type(stmt.type)} ${this.name_(stmt.name)} = null;`;
            else if (stmt.initializer !== null)
                res = `var ${this.name_(stmt.name)} = ${this.expr(stmt.initializer)};`;
            else
                res = `${this.type(stmt.type)} ${this.name_(stmt.name)};`;
        } else if (stmt instanceof ForeachStatement) {
            res = `foreach (var ${this.name_(stmt.itemVar.name)} in ${this.expr(stmt.items)})` + this.block(stmt.body);
        } else if (stmt instanceof IfStatement) {
            const elseIf = stmt.else_ !== null && stmt.else_.statements.length === 1 && stmt.else_.statements[0] instanceof IfStatement;
            res = `if (${this.expr(stmt.condition)})${this.block(stmt.then)}`;
            res += (elseIf ? `\nelse ${this.stmt(stmt.else_.statements[0])}` : "") +
                (!elseIf && stmt.else_ !== null ? `\nelse` + this.block(stmt.else_) : "");
        } else if (stmt instanceof WhileStatement) {
            res = `while (${this.expr(stmt.condition)})` + this.block(stmt.body);
        } else if (stmt instanceof ForStatement) {
            res = `for (${stmt.itemVar !== null ? this.var(stmt.itemVar) : ""}; ${this.expr(stmt.condition)}; ${this.expr(stmt.incrementor)})` + this.block(stmt.body);
        } else if (stmt instanceof DoStatement) {
            res = `do${this.block(stmt.body)} while (${this.expr(stmt.condition)});`;
        } else if (stmt instanceof TryStatement) {
            res = "try" + this.block(stmt.tryBody, false);
            if (stmt.catchBody !== null) {
                this.usings.add("System");
                res += ` catch (Exception ${this.name_(stmt.catchVar.name)}) ${this.block(stmt.catchBody, false)}`;
            }
            if (stmt.finallyBody !== null)
                res += "finally" + this.block(stmt.finallyBody);
        } else if (stmt instanceof ContinueStatement) {
            res = `continue;`;
        } else debugger;
        return this.leading(stmt) + res;
    }

    static stmts(stmts: Statement[]): string { return stmts.map(stmt => this.stmt(stmt)).join("\n"); }
    static rawBlock(block: Block): string { return this.stmts(block.statements); }

    static methodBase(method: IMethodBase, returns: Type, visibility: Visibility, bodyPrefix: Statement[] = null): string {
        if (method === null) return "";
        const name = method instanceof Method ? method.name : method instanceof Constructor ? method.parentClass.name : "???";
        const typeArgs = method instanceof Method ? method.typeArguments : null;
        const overrides = method instanceof Method ? method.overrides !== null : false;
        const virtual = method instanceof Method ? !overrides && method.overriddenBy.length > 0 : false;
        const intfMethod = method instanceof Method ? method.parentInterface instanceof Interface : false;
        const async = method instanceof Method ? method.async : false;
        return this.preIf("/* throws */ ", method.throws) + 
            (intfMethod ? "" : this.vis(visibility) + " ") +
            this.preIf("virtual ", virtual) + this.preIf("override ", overrides) +
            this.preIf("async ", async) +
            (method instanceof Constructor ? "" : `${this.type(returns)} `) +
            this.name_(name) + this.typeArgs(typeArgs) + 
            `(${method.parameters.map(p => this.var(p)).join(", ")})` +
            (method instanceof Constructor && method.superCallArgs !== null ? `: base(${method.superCallArgs.map(x => this.expr(x)).join(", ")})` : "") + 
            (method.body !== null ? ` {\n${this.pad(this.stmts((bodyPrefix || []).concat(method.body.statements)))}\n}` : ";");
    }

    static classLike(cls: IInterface) {
        this.currentClass = cls;
        const resList: string[] = [];

        const bodyPrefix: Statement[] = [];
        if (cls instanceof Class) {
            resList.push(cls.fields.map(field => {
                const isInitializerComplex = field.initializer !== null && 
                    !(field.initializer instanceof StringLiteral) && 
                    !(field.initializer instanceof BooleanLiteral) && 
                    !(field.initializer instanceof NumericLiteral);

                const prefix = `${this.vis(field.visibility)} ${this.preIf("static ", field.isStatic)}`;
                if (field.interfaceDeclarations.length > 0)
                    return `${prefix}${this.varWoInit(field)} { get; set; }`;
                else if (isInitializerComplex) {
                    const fieldRef = field.isStatic ? <Reference>new StaticFieldReference(field) : new InstanceFieldReference(new ThisReference(cls), field);
                    bodyPrefix.push(new ExpressionStatement(new BinaryExpression(fieldRef, "=", field.initializer)));
                    return `${prefix}${this.varWoInit(field)};`;
                } else
                    return `${prefix}${this.var(field)};`;
            }).join("\n"));

            resList.push(cls.properties.map(prop => {
                return `${this.vis(prop.visibility)} ${this.preIf("static ", prop.isStatic)}` +
                    this.varWoInit(prop) +
                    (prop.getter !== null ? ` {\n    get {\n${this.pad(this.block(prop.getter))}\n    }\n}` : "") +
                    (prop.setter !== null ? ` {\n    set {\n${this.pad(this.block(prop.setter))}\n    }\n}` : "");
            }).join("\n"));

            resList.push(this.methodBase(cls.constructor_, VoidType.instance, Visibility.Public, bodyPrefix));
        } else if (cls instanceof Interface) {
            resList.push(cls.fields.map(field => `${this.type(field.type)} ${this.name_(field.name)} { get; set; }`).join("\n"));
        }

        const methods: string[] = [];
        for (const method of cls.methods) {
            if (cls instanceof Class && method.body === null) continue; // declaration only
            methods.push(
                this.preIf("static ", method.isStatic) + 
                this.preIf("/* mutates */ ", method.mutates) + 
                this.methodBase(method, method.returns, method.visibility));
        }
        resList.push(methods.join("\n\n"));
        return this.pad(resList.filter(x => x !== "").join("\n\n"));
    }

    static pad(str: string): string { return str.split(/\n/g).map(x => `    ${x}`).join('\n'); }

    static pathToNs(path: string): string {
        // Generator/ExprLang/ExprLangAst.ts -> Generator.ExprLang
        const parts = path.split(/\//g);
        parts.pop();
        return parts.join('.');
    }

    static genFile(sourceFile: SourceFile): string {
        const enums = sourceFile.enums.map(enum_ => `public enum ${this.name_(enum_.name)} { ${enum_.values.map(x => this.name_(x.name)).join(", ")} }`);

        const intfs = sourceFile.interfaces.map(intf => `public interface ${this.name_(intf.name)}${this.typeArgs(intf.typeArguments)}`+
            `${this.preArr(" : ", intf.baseInterfaces.map(x => this.type(x)))} {\n${this.classLike(intf)}\n}`);

        const classes: string[] = [];
        for (const cls of sourceFile.classes) {
            const baseClasses: Type[] = [];
            if (cls.baseClass !== null)
                baseClasses.push(cls.baseClass);
            for (const intf of cls.baseInterfaces)
                baseClasses.push(intf);
            classes.push(`public class ${this.name_(cls.name)}${this.typeArgs(cls.typeArguments)}${this.preArr(" : ", baseClasses.map(x => this.type(x)))} {\n${this.classLike(cls)}\n}`);
        }

        const main = sourceFile.mainBlock.statements.length > 0 ? 
            `public class Program\n{\n    static void Main(string[] args)\n    {\n${this.pad(this.rawBlock(sourceFile.mainBlock))}\n    }\n}` : "";

        const usingsSet = new Set<string>(sourceFile.imports.map(x => this.pathToNs(x.exportScope.scopeName)).filter(x => x !== ""));
        const usings: string[] = [];
        for (const using of this.usings)
            usings.push(`using ${using};`);
        for (const using of usingsSet)
            usings.push(`using ${using};`);

        let result = [enums.join("\n"), intfs.join("\n\n"), classes.join("\n\n"), main].filter(x => x !== "").join("\n\n");
        result = `${usings.join("\n")}\n\nnamespace ${this.pathToNs(sourceFile.sourcePath.path)}\n{\n${this.pad(result)}\n}`;
        return result;
    }

    static generate(pkg: Package): GeneratedFile[] {
        const result: GeneratedFile[] = [];
        for (const path of Object.keys(pkg.files))
            result.push(new GeneratedFile(path, this.genFile(pkg.files[path])));
        return result;
    }
}