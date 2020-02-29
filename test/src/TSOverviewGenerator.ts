import { NewExpression, Identifier, Literal, TemplateString, ArrayLiteral, CastExpression, BooleanLiteral, StringLiteral, NumericLiteral, CharacterLiteral, PropertyAccessExpression, Expression, ElementAccessExpression, BinaryExpression, UnresolvedCallExpression, ConditionalExpression, InstanceOfExpression, ParenthesizedExpression, RegexLiteral, UnaryExpression, UnaryType, MapLiteral, NullLiteral, AwaitExpression } from "@one/One/Ast/Expressions";
import { Statement, ReturnStatement, UnsetStatement, ThrowStatement, ExpressionStatement, VariableDeclaration, BreakStatement, ForeachStatement, IfStatement, WhileStatement, ForStatement, DoStatement, ContinueStatement } from "@one/One/Ast/Statements";
import { Method, Block, Class, SourceFile, IMethodBase, MethodParameter, Constructor, IVariable, Lambda } from "@one/One/Ast/Types";
import { Type, VoidType, AnyType, NullType, EnumType, GenericsType, MethodType, ClassType, InterfaceType, UnresolvedType, IHasTypeArguments, IType } from "@one/One/Ast/AstTypes";

export class TSOverviewGenerator {
    static leading(item: any, isStmt: boolean) {
        let result = "";
        if (item.leadingTrivia && (isStmt ? item.leadingTrivia.length > 0 : item.leadingTrivia.trim().length > 0))
            result += item.leadingTrivia;
        if (item.attributes)
            result += Object.entries(item.attributes).map(([name, data]) => `/// {ATTR} name="${name}", value=${JSON.stringify(data)}\n`).join("");
        return result;
    }

    static array<T>(items: T[], callback: (item: T) => string) {
        return items.map(item => this.leading(item, false) + callback(item));
    }

    static map<T>(items: { [name: string]: T }, callback: (item: T) => string) {
        return Object.entries(items).map(([name, item]) => this.leading(item, false) + 
            (name !== (<any>item).name ? `/* name on object "${(<any>item).name}" is different from "${name}" */` : "") + callback(item));
    }

    static pre(prefix: string, value: any, separator = ", ") {
        if (Array.isArray(value))
            return value.length > 0 ? `${prefix}${value.join(separator)}` : "";
        else if (typeof value === "boolean")
            return value ? prefix : "";
        else if (value !== null && typeof value !== "undefined")
            return `${prefix}${value}`;
        return "";
    }

    static name_(obj: any) { return `${obj instanceof Constructor ? "constructor" : obj.name}${this.typeArgs(obj.typeArguments)}`; }
    static typeArgs(args: string[]) { return args && args.length > 0 ? `<${args.join(", ")}>` : ""; }
    
    static type(t: IType, raw = false) {
        const repr = !t ? "???" :
            t instanceof VoidType ? "void" :
            t instanceof AnyType ? "any" :
            t instanceof NullType ? "null" :
            t instanceof EnumType ? `E:${t.decl.name}` :
            t instanceof GenericsType ? `G:${t.typeVarName}` :
            t instanceof MethodType ? `M:${t.decl.parentInterface.name}::${t.decl.name}` :
            t instanceof ClassType ? `C:${t.decl.name}` :
            t instanceof InterfaceType ? `I:${t.decl.name}` :
            t instanceof UnresolvedType ? `X:${t.typeName}` :
            "NOTIMPL";
        const typeArgs = t && (<IHasTypeArguments><any>t).typeArguments;
        return (raw ? "" : "{T}") + repr + (typeArgs && typeArgs.length > 0 ? `<${typeArgs.map(x => this.type(x, true)).join(", ")}>` : "");
    }

    static var(v: IVariable) { return `` + 
        this.pre("static ", (<any>v).static) + 
        ((<any>v).visibility ? `${(<any>v).visibility} ` : "") +
        this.pre("/* unused */", (<any>v).isUnused) + 
        this.pre("/* mutable */", (<any>v).isMutable) + 
        `${v.name}: ${this.type(v.type)}${this.pre(" = ", this.expr((<any>v).initializer))}`;
    }

    static expr(expr: Expression) {
        if (!expr) return null;

        let res = "UNKNOWN-EXPR";
        if (expr instanceof NewExpression) {
            res = `new ${this.type(expr.cls)}(${expr.args.map(x => this.expr(x)).join(", ")})`;
        } else if (expr instanceof Identifier) {
            res = `{ID}${expr.text}`;
        } else if (expr instanceof PropertyAccessExpression) {
            res = `${this.expr(expr.object)}.{PA}${expr.propertyName}`;
        } else if (expr instanceof UnresolvedCallExpression) {
            const typeArgs = expr.typeArgs.length > 0 ? `<${expr.typeArgs.map(x => this.type(x)).join(", ")}>` : "";
            res = `${this.expr(expr.method)}${typeArgs}(${expr.args.map(x => this.expr(x)).join(", ")})`;
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
        } else if (expr instanceof ConditionalExpression) {
            res = `${this.expr(expr.condition)} ? ${this.expr(expr.whenTrue)} : ${this.expr(expr.whenFalse)}`;
        } else if (expr instanceof InstanceOfExpression) {
            res = `${this.expr(expr.expr)} instanceof ${this.type(expr.type)}`;
        } else if (expr instanceof ParenthesizedExpression) {
            res = `(${this.expr(expr.expression)})`;
        } else if (expr instanceof RegexLiteral) {
            res = `/${expr.pattern}/${expr.global ? "g" : ""}${expr.caseInsensitive ? "g" : ""}`;
        } else if (expr instanceof Lambda) {
            res = `(${expr.parameters.map(x => x.name + (x.type ? `: ${this.type(x.type)}` : "")).join(", ")}) => ${this.block(expr.body)}`;
        } else if (expr instanceof UnaryExpression && expr.unaryType === UnaryType.Prefix) {
            res = `${expr.operator}${this.expr(expr.operand)}`;
        } else if (expr instanceof UnaryExpression && expr.unaryType === UnaryType.Postfix) {
            res = `${this.expr(expr.operand)}${expr.operator}`;
        } else if (expr instanceof MapLiteral) {
            res = `{\n${this.pad(Object.entries(expr.properties).map(([key, value]) => `${key}: ${this.expr(value)}`).join(",\n"))}\n}`;
        } else if (expr instanceof NullLiteral) {
            res = `null`;
        } else if (expr instanceof AwaitExpression) {
            res = `await ${this.expr(expr.expr)}`;
        } else debugger;
        return res;
    }

    static blockOrStmt(block: Block) {
        const stmtLen = block.statements.length;
        return stmtLen === 0 ? " { }" : stmtLen === 1 ? `\n${this.pad(this.block(block))}` : ` {\n${this.pad(this.block(block))}\n}`;
    }

    static stmt(stmt: Statement) {
        let res = "UNKNOWN-STATEMENT";
        if (stmt instanceof BreakStatement) {
            res = "break;";
        } else if (stmt instanceof ReturnStatement) {
            res = `return ${this.expr(stmt.expression)};`;
        } else if (stmt instanceof UnsetStatement) {
            res = `unset ${this.expr(stmt.expression)};`;
        } else if (stmt instanceof ThrowStatement) {
            res = `throw ${this.expr(stmt.expression)};`;
        } else if (stmt instanceof ExpressionStatement) {
            res = `${this.expr(stmt.expression)};`;
        } else if (stmt instanceof VariableDeclaration) {
            res = `${stmt.isMutable ? "let" : "const"} ${this.var(stmt)};`;
        } else if (stmt instanceof ForeachStatement) {
            res = `for (const ${stmt.itemVar.name} of ${this.expr(stmt.items)})` + this.blockOrStmt(stmt.body);
        } else if (stmt instanceof IfStatement) {
            const elseIf = stmt.else && stmt.else.statements.length === 1 && stmt.else.statements[0] instanceof IfStatement;
            res = `if (${this.expr(stmt.condition)})` + 
                this.blockOrStmt(stmt.then) + 
                (elseIf ? `\nelse ${this.stmt(stmt.else.statements[0])}` : "") +
                (!elseIf && stmt.else ? `\nelse` + this.blockOrStmt(stmt.else) : "");
        } else if (stmt instanceof WhileStatement) {
            res = `while (${this.expr(stmt.condition)})` + this.blockOrStmt(stmt.body);
        } else if (stmt instanceof ForStatement) {
            res = `for (${stmt.itemVar ? this.var(stmt.itemVar) : ""}; ${this.expr(stmt.condition)}; ${this.expr(stmt.incrementor)})` + this.blockOrStmt(stmt.body);
        } else if (stmt instanceof DoStatement) {
            res = `do${this.blockOrStmt(stmt.body)} while (${this.expr(stmt.condition)})`;
        } else if (stmt instanceof ContinueStatement) {
            res = `continue;`;
        } else debugger;
        return this.leading(stmt, true) + res;
    }

    static block(block: Block) { return block.statements.map(stmt => this.stmt(stmt)).join("\n"); }

    static methodBase(method: IMethodBase, returns: Type = null) {
        if (!method) return "";
        return this.pre("/* throws */ ", method.throws) + 
            `${this.name_(method)}(${method.parameters.map(p => this.var(p)).join(", ")})` +
            (returns ? `: ${this.type(returns)}` : "") +
            (method.body ? ` {\n${this.pad(this.block(method.body))}\n}` : "");
    }

    static method(method: Method) {
        if (!method) return "";
        return "" +
            this.pre("static ", method.isStatic) + 
            this.pre("/* mutates */ ", method.mutates) + 
            this.methodBase(method, method.returns);
    }

    static classLike(cls: Class) {
        const fields = cls.fields ? this.map(cls.fields, field => `${this.var(field)};`) : [];
        const props = cls.properties ? this.map(cls.properties, prop => `${this.var(prop)};`) : [];
        const constr = this.methodBase(cls.constructor_);
        const methods = this.map(cls.methods, method => this.method(method));
        return this.pad([fields.join("\n"), props.join("\n"), constr, methods.join("\n\n")].filter(x => x !== "").join("\n\n"));
    }

    static pad(str: string){ return str.split("\n").map(x => `    ${x}`).join('\n'); }

    static generate(sourceFile: SourceFile) {
        const imps = this.array(sourceFile.imports, imp => 
            (imp.importAll ? `import * as ${imp.importAs}` : `import { ${imp.importedTypes.map(x => this.type(x)).join(", ")} }`) +
            ` from "${imp.exportScope.packageName}${this.pre("/", imp.exportScope.scopeName)}";`);
        const enums = this.map(sourceFile.enums, enum_ => `enum ${enum_.name} { ${enum_.values.map(x => x.name).join(", ")} }`);
        const intfs = this.map(sourceFile.interfaces, intf => `interface ${this.name_(intf)}`+
            `${this.pre(" extends ", intf.baseInterfaces)} {\n${this.classLike(<Class>intf)}\n}`);
        const classes = this.map(sourceFile.classes, cls => `class ${this.name_(cls)}`+
            `${this.pre(" extends ", cls.baseClass)}${this.pre(" implements ", cls.baseInterfaces)} {\n${this.classLike(cls)}\n}`);
        const main = this.block(sourceFile.mainBlock);
        const result = `// export scope: ${sourceFile.exportScope.packageName}/${sourceFile.exportScope.scopeName}\n`+
            [imps.join("\n"), enums.join("\n"), intfs.join("\n\n"), classes.join("\n\n"), main].filter(x => x !== "").join("\n\n");
        return result;
    }
}