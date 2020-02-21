import { NewExpression, Identifier, Literal, TemplateString, ArrayLiteral, CastExpression, BooleanLiteral, StringLiteral, NumericLiteral, CharacterLiteral, PropertyAccessExpression, Expression, CallExpression, ElementAccessExpression, BinaryExpression } from "./Ast/Expressions";
import { Statement, ReturnStatement, UnsetStatement, ThrowStatement, ExpressionStatement, VariableDeclaration, BreakStatement } from "./Ast/Statements";
import { Method, Block, Class, SourceFile, IMethodBase, MethodParameter, Constructor, IVariable } from "./Ast/Types";
import { Type, VoidType, AnyType, NullType, EnumType, GenericsType, MethodType, ClassType, InterfaceType, UnresolvedType, IHasTypeArguments } from "./Ast/AstTypes";

export class TSOverviewGenerator {
    leading(item: any) {
        let result = "";
        if ((<any>item).leadingTrivia && (<any>item).leadingTrivia.trim().length > 0)
            result += (<any>item).leadingTrivia;
        if ((<any>item).attributes)
            result += Object.entries((<any>item).attributes).map(([name, data]) => `/// {ATTR} name="${name}", value=${JSON.stringify(data)}\n`).join("");
        return result;
    }

    array<T>(items: T[], callback: (item: T) => string) {
        return items.map(item => this.leading(item) + callback(item));
    }

    map<T>(items: { [name: string]: T }, callback: (item: T) => string) {
        return Object.entries(items).map(([name, item]) => this.leading(item) + 
            (name !== (<any>item).name ? `/* name on object "${(<any>item).name}" is different from "${name}" */` : "") + callback(item));
    }

    pre(prefix: string, value: any, separator = ", ") {
        if (Array.isArray(value))
            return value.length > 0 ? `${prefix}${value.join(separator)}` : "";
        else if (typeof value === "boolean")
            return value ? prefix : "";
        else if (value !== null && typeof value !== "undefined")
            return `${prefix}${value}`;
        return "";
    }

    name(obj: any) { return `${obj instanceof Constructor ? "constructor" : obj.name}${this.typeArgs(obj.typeArguments)}`; }
    typeArgs(args: string[]) { return args && args.length > 0 ? `<${args.join(", ")}>` : ""; }
    
    type(t: Type, raw = false) {
        const repr = !t ? "???" :
            t instanceof VoidType ? "void" :
            t instanceof AnyType ? "any" :
            t instanceof NullType ? "null" :
            t instanceof EnumType ? `E:${t.decl.name}` :
            t instanceof GenericsType ? `G:${t.typeVarName}` :
            t instanceof MethodType ? `M:${t.decl.parentClass.name}::${t.decl.name}` :
            t instanceof ClassType ? `C:${t.decl.name}` :
            t instanceof InterfaceType ? `I:${t.decl.name}` :
            t instanceof UnresolvedType ? `X:${t.typeName}` :
            "NOTIMPL";
        const typeArgs = t && (<IHasTypeArguments><any>t).typeArguments;
        return (raw ? "" : "{T}") + repr + (typeArgs && typeArgs.length > 0 ? `<${typeArgs.map(x => this.type(x, true)).join(", ")}>` : "");
    }

    var(v: IVariable) { return `` + 
        this.pre("static ", (<any>v).static) + 
        ((<any>v).visibility ? `${(<any>v).visibility} ` : "") +
        this.pre("/* unused */", (<any>v).isUnused) + 
        this.pre("/* mutable */", (<any>v).isMutable) + 
        `${v.name}: ${this.type(v.type)}${this.pre(" = ", this.expr((<any>v).initializer))}`;
    }

    expr(expr: Expression) {
        if (!expr) return null;

        let res = "UNKNOWN-EXPR";
        if (expr instanceof NewExpression) {
            res = `new ${this.type(expr.cls)}(${expr.args.map(x => this.expr(x)).join(", ")})`;
        } else if (expr instanceof Identifier) {
            res = `{ID}${expr.text}`;
        } else if (expr instanceof PropertyAccessExpression) {
            res = `${this.expr(expr.object)}.{PA}${expr.propertyName}`;
        } else if (expr instanceof CallExpression) {
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
            res = "`" + expr.parts.map(x => x.isLiteral ? x.literalText : "${" + this.expr(x.expression) + "}").join('') + "`"
        } else if (expr instanceof BinaryExpression) {
            res = `${this.expr(expr.left)} ${expr.operator} ${this.expr(expr.right)}`;
        } else if (expr instanceof ArrayLiteral) {
            res = `[${expr.items.map(x => this.expr(x)).join(', ')}]`;
        } else if (expr instanceof CastExpression) {
            res = `<${this.type(expr.newType)}>${this.expr(expr.expression)}`;
        } else debugger;
        return res;
    }

    stmt(stmt: Statement) {
        let res = "UNKNOWN-STATEMENT";
        if (stmt instanceof BreakStatement) {
            res = "break";
        } else if (stmt instanceof ReturnStatement) {
            res = `return ${this.expr(stmt.expression)}`;
        } else if (stmt instanceof UnsetStatement) {
            res = `unset ${this.expr(stmt.expression)}`;
        } else if (stmt instanceof ThrowStatement) {
            res = `throw ${this.expr(stmt.expression)}`;
        } else if (stmt instanceof ExpressionStatement) {
            res = this.expr(stmt.expression);
        } else if (stmt instanceof VariableDeclaration) {
            res = `${stmt.isMutable ? "let" : "const"} ${this.var(stmt)}`;
        } else debugger;
        return this.leading(stmt) + res + ';';
    }

    block(block: Block) { return block.statements.map(stmt => this.stmt(stmt)).join("\n"); }

    methodBase(method: IMethodBase, returns: Type = null) {
        if (!method) return "";
        return this.pre("/* throws */ ", method.throws) + 
            `${this.name(method)}(${method.parameters.map(p => this.var(p)).join(", ")})`+
            `${returns ? `: ${this.type(returns)}` : ""} {\n${this.pad(this.block(method.body))}\n}`;
    }

    method(method: Method) {
        if (!method) return "";
        return "" +
            this.pre("static ", method.isStatic) + 
            this.pre("/* mutates */ ", method.mutates) + 
            this.methodBase(method, method.returns);
    }

    classLike(cls: Class) {
        const fields = this.map(cls.fields, field => `${this.var(field)};`);
        const props = this.map(cls.properties, prop => `${this.var(prop)};`);
        const constr = this.methodBase(cls.constructor_);
        const methods = this.map(cls.methods, method => this.method(method));
        return this.pad([fields.join("\n"), props.join("\n"), constr, methods.join("\n\n")].filter(x => x !== "").join("\n\n"));
    }

    pad(str: string){ return str.split("\n").map(x => `    ${x}`).join('\n'); }

    generate(sourceFile: SourceFile) {
        const imps = this.array(sourceFile.imports, imp => `import { ${imp.importName} } from "${imp.packageName}";`);
        const enums = this.map(sourceFile.enums, enum_ => `enum ${enum_.name} { ${enum_.values.map(x => x.name).join(", ")} }`);
        const intfs = this.map(sourceFile.interfaces, intf => `interface ${this.name(intf)}`+
            `${this.pre(" extends ", intf.baseInterfaces)} {\n${this.classLike(<Class>intf)}\n}`);
        const classes = this.map(sourceFile.classes, cls => `class ${this.name(cls)}`+
            `${this.pre(" extends ", cls.baseClass)}${this.pre(" implements ", cls.baseInterfaces)} {\n${this.classLike(cls)}\n}`);
        const main = this.block(sourceFile.mainBlock);
        const result = [imps.join("\n"), enums.join("\n"), intfs.join("\n\n"), classes.join("\n\n"), main].filter(x => x !== "").join("\n\n");
        return result;
    }
}