import { NewExpression, Identifier, TemplateString, ArrayLiteral, CastExpression, BooleanLiteral, StringLiteral, NumericLiteral, CharacterLiteral, PropertyAccessExpression, Expression, ElementAccessExpression, BinaryExpression, UnresolvedCallExpression, ConditionalExpression, InstanceOfExpression, ParenthesizedExpression, RegexLiteral, UnaryExpression, UnaryType, MapLiteral, NullLiteral, AwaitExpression, UnresolvedNewExpression } from "../One/Ast/Expressions";
import { Statement, ReturnStatement, UnsetStatement, ThrowStatement, ExpressionStatement, VariableDeclaration, BreakStatement, ForeachStatement, IfStatement, WhileStatement, ForStatement, DoStatement, ContinueStatement, ForVariable } from "../One/Ast/Statements";
import { Method, Block, Class, IClassMember, SourceFile, IMethodBase, Constructor, IVariable, Lambda, IImportable, UnresolvedImport, Interface, Enum, IInterface, Field, Property, MethodParameter, IVariableWithInitializer, Visibility } from "../One/Ast/Types";
import { Type, VoidType, AnyType, EnumType, GenericsType, ClassType, InterfaceType, UnresolvedType, IHasTypeArguments, IType, LambdaType } from "../One/Ast/AstTypes";
import { ThisReference, EnumReference, ClassReference, MethodParameterReference, VariableDeclarationReference, ForVariableReference, ForeachVariableReference, SuperReference, GlobalFunctionReference, StaticFieldReference, StaticMethodReference, StaticPropertyReference, InstanceFieldReference, InstancePropertyReference, InstanceMethodReference, EnumMemberReference } from "../One/Ast/References";

export class TSOverviewGenerator {
    static leading(item: any, isStmt: boolean) {
        let result = "";
        if (item.leadingTrivia && (isStmt ? item.leadingTrivia.length > 0 : item.leadingTrivia.trim().length > 0))
            result += item.leadingTrivia;
        if (item.attributes)
            result += Object.entries(item.attributes).map(x => `/// {ATTR} name="${x[0]}", value=${JSON.stringify(x[1])}\n`).join("");
        return result;
    }

    static array<T>(items: T[], callback: (item: T) => string) {
        return items.map(item => this.leading(item, false) + callback(item));
    }

    static map<T>(items: Map<string, T>, callback: (item: T) => string) {
        return Array.from(items.entries()).map(x => this.leading(x[1], false) + 
            (x[0] !== (<any>x[1]).name ? `/* name on object "${(<any>x[1]).name}" is different from "${x[0]}" */` : "") + callback(x[1]));
    }

    static pre(prefix: string, value: any, separator = ", ") {
        if (Array.isArray(value))
            return value.length > 0 ? `${prefix}${value.join(separator)}` : "";
        else if (typeof value === "boolean")
            return value ? prefix : "";
        else if (value)
            return `${prefix}${value}`;
        return "";
    }

    static name_(obj: any) { return `${obj instanceof Constructor ? "constructor" : obj.name}${this.typeArgs(obj.typeArguments)}`; }
    static typeArgs(args: string[]) { return args && args.length > 0 ? `<${args.join(", ")}>` : ""; }
    
    static type(t: Type, raw = false) {
        const repr = !t ? "???" :
            t instanceof VoidType ? "void" :
            t instanceof AnyType ? "any" :
            t instanceof EnumType ? `E:${t.decl.name}` :
            t instanceof GenericsType ? `G:${t.typeVarName}` :
            t instanceof ClassType ? `C:${t.decl.name}` :
            t instanceof InterfaceType ? `I:${t.decl.name}` :
            t instanceof UnresolvedType ? `X:${t.typeName}` :
            t instanceof LambdaType ? `L:(${t.parameters.map(x => this.type(x.type, true)).join(", ")})=>${this.type(t.returnType, true)}` :
            "NOTIMPL";
        if (repr === "NOTIMPL") debugger;
        const typeArgs = t && (<IHasTypeArguments><any>t).typeArguments;
        return (raw ? "" : "{T}") + repr + (typeArgs && typeArgs.length > 0 ? `<${typeArgs.map(x => this.type(x, true)).join(", ")}>` : "");
    }

    static var(v: IVariable) {
        let result = "";
        if (v instanceof Field || v instanceof Property) {
            const m = <IClassMember>v;
            result += this.pre("static ", m.isStatic);
            result += 
                m.visibility === Visibility.Private ? "private " : 
                m.visibility === Visibility.Protected ? "protected " :
                m.visibility === Visibility.Public ? "public " :
                "VISIBILITY-NOT-SET";
        }
        result += `${v.name}: ${this.type(v.type)}`;
        if (v instanceof VariableDeclaration || v instanceof ForVariable || v instanceof Field || v instanceof MethodParameter)
            result += this.pre(" = ", this.expr((<IVariableWithInitializer>v).initializer));
        return result;
    }

    static expr(expr: Expression) {
        if (!expr) return null;

        let res = "UNKNOWN-EXPR";
        if (expr instanceof NewExpression) {
            res = `new ${this.type(expr.cls)}(${expr.args.map(x => this.expr(x)).join(", ")})`;
        } else if (expr instanceof UnresolvedNewExpression) {
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
            res = "`" + expr.parts.map(x => x.isLiteral ? x.literalText : "${" + this.expr(x.expression) + "}").join('') + "`";
        } else if (expr instanceof BinaryExpression) {
            res = `${this.expr(expr.left)} ${expr.operator} ${this.expr(expr.right)}`;
        } else if (expr instanceof ArrayLiteral) {
            res = `[${expr.items.map(x => this.expr(x)).join(', ')}]`;
        } else if (expr instanceof CastExpression) {
            res = `<${this.type(expr.newType)}>(${this.expr(expr.expression)})`;
        } else if (expr instanceof ConditionalExpression) {
            res = `${this.expr(expr.condition)} ? ${this.expr(expr.whenTrue)} : ${this.expr(expr.whenFalse)}`;
        } else if (expr instanceof InstanceOfExpression) {
            res = `${this.expr(expr.expr)} instanceof ${this.type(expr.checkType)}`;
        } else if (expr instanceof ParenthesizedExpression) {
            res = `(${this.expr(expr.expression)})`;
        } else if (expr instanceof RegexLiteral) {
            res = `/${expr.pattern}/${expr.global ? "g" : ""}${expr.caseInsensitive ? "g" : ""}`;
        } else if (expr instanceof Lambda) {
            res = `(${expr.parameters.map(x => x.name + (x.type ? `: ${this.type(x.type)}` : "")).join(", ")}) => { ${this.block(expr.body)} }`;
        } else if (expr instanceof UnaryExpression && expr.unaryType === UnaryType.Prefix) {
            res = `${expr.operator}${this.expr(expr.operand)}`;
        } else if (expr instanceof UnaryExpression && expr.unaryType === UnaryType.Postfix) {
            res = `${this.expr(expr.operand)}${expr.operator}`;
        } else if (expr instanceof MapLiteral) {
            const repr = Object.entries(expr.properties).map(keyValue => `${keyValue[0]}: ${this.expr(keyValue[1])}`).join(",\n");
            res = repr === "" ? "{}" : repr.includes("\n") ? `{\n${this.pad(repr)}\n}` : `{ ${repr} }`;
        } else if (expr instanceof NullLiteral) {
            res = `null`;
        } else if (expr instanceof AwaitExpression) {
            res = `await ${this.expr(expr.expr)}`;
        } else if (expr instanceof ThisReference) {
            res = `{R}this`;
        } else if (expr instanceof EnumReference) {
            res = `{Enum}${expr.decl.name}`;
        } else if (expr instanceof ClassReference) {
            res = `{Cls}${expr.decl.name}`;
        } else if (expr instanceof MethodParameterReference) {
            res = `{MetP}${expr.decl.name}`;
        } else if (expr instanceof VariableDeclarationReference) {
            res = `{V}${expr.decl.name}`;
        } else if (expr instanceof ForVariableReference) {
            res = `{FVR}${expr.decl.name}`;
        } else if (expr instanceof ForeachVariableReference) {
            res = `{FEVR}${expr.decl.name}`;
        } else if (expr instanceof GlobalFunctionReference) {
            res = `{GFR}${expr.decl.name}`;
        } else if (expr instanceof SuperReference) {
            res = `{R}super`;
        } else if (expr instanceof StaticFieldReference) {
            res = `{SF}${expr.decl.parentClass.name}::${expr.decl.name}`;
        } else if (expr instanceof StaticPropertyReference) {
            res = `{SP}${expr.decl.parentClass.name}::${expr.decl.name}`;
        } else if (expr instanceof StaticMethodReference) {
            res = `{SM}${expr.decl.parentInterface.name}::${expr.decl.name}`;
        } else if (expr instanceof InstanceFieldReference) {
            res = `${this.expr(expr.object)}.{F}${expr.field.name}`;
        } else if (expr instanceof InstancePropertyReference) {
            res = `${this.expr(expr.object)}.{P}${expr.property.name}`;
        } else if (expr instanceof InstanceMethodReference) {
            res = `${this.expr(expr.object)}.{M}${expr.method.name}`;
        } else if (expr instanceof EnumMemberReference) {
            res = `{E}${expr.decl.parentEnum.name}::${expr.decl.name}`;
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
            const elseIf = stmt.else_ && stmt.else_.statements.length === 1 && stmt.else_.statements[0] instanceof IfStatement;
            res = `if (${this.expr(stmt.condition)})` + 
                this.blockOrStmt(stmt.then) + 
                (elseIf ? `\nelse ${this.stmt(stmt.else_.statements[0])}` : "") +
                (!elseIf && stmt.else_ ? `\nelse` + this.blockOrStmt(stmt.else_) : "");
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

    static methodBase(method: IMethodBase, returns: Type = new VoidType()) {
        if (!method) return "";
        return this.pre("/* throws */ ", method.throws) + 
            `${this.name_(method)}(${method.parameters.map(p => this.var(p)).join(", ")})` +
            (returns instanceof VoidType ? "" : `: ${this.type(returns)}`) +
            (method.body ? ` {\n${this.pad(this.block(method.body))}\n}` : ";");
    }

    static method(method: Method) {
        if (!method) return "";
        return "" +
            this.pre("static ", method.isStatic) + 
            this.pre("/* mutates */ ", method.mutates) + 
            this.methodBase(method, method.returns);
    }

    static classLike(cls: IInterface) {
        const fields = cls instanceof Class ? this.map(cls.fields, field => `${this.var(field)};`) : [];
        const props = cls instanceof Class ? this.map(cls.properties, prop => `${this.var(prop)};`) : [];
        const constr = cls instanceof Class ? this.methodBase(cls.constructor_) : "";
        const methods = this.map(cls.methods, method => this.method(method));
        return this.pad([fields.join("\n"), props.join("\n"), constr, methods.join("\n\n")].filter(x => x !== "").join("\n\n"));
    }

    static pad(str: string) { return str.split("\n").map(x => `    ${x}`).join('\n'); }
    static imp(imp: IImportable) { return "" + 
        (imp instanceof UnresolvedImport ? "X" : imp instanceof Class ? "C" : imp instanceof Interface ? "I" : imp instanceof Enum ? "E" : "???") +
        `:${imp.name}`; }

    static generate(sourceFile: SourceFile) {
        const imps = this.array(sourceFile.imports, imp => 
            (imp.importAll ? `import * as ${imp.importAs}` : `import { ${imp.imports.map(x => this.imp(x)).join(", ")} }`) +
            ` from "${imp.exportScope.packageName}${this.pre("/", imp.exportScope.scopeName)}";`);
        const enums = this.map(sourceFile.enums, enum_ => `enum ${enum_.name} { ${Array.from(enum_.values.values()).map(x => x.name).join(", ")} }`);
        const intfs = this.map(sourceFile.interfaces, intf => `interface ${this.name_(intf)}`+
            `${this.pre(" extends ", intf.baseInterfaces.map(x => this.type(x)))} {\n${this.classLike(intf)}\n}`);
        const classes = this.map(sourceFile.classes, cls => `class ${this.name_(cls)}`+
            this.pre(" extends ", cls.baseClass ? this.type(cls.baseClass) : null) + 
            this.pre(" implements ", cls.baseInterfaces.map(x => this.type(x))) + 
            ` {\n${this.classLike(cls)}\n}`);
        const funcs = this.map(sourceFile.funcs, func => `function ${this.name_(func)}${this.methodBase(func, func.returns)}`);
        const main = this.block(sourceFile.mainBlock);
        const result = `// export scope: ${sourceFile.exportScope.packageName}/${sourceFile.exportScope.scopeName}\n`+
            [imps.join("\n"), enums.join("\n"), intfs.join("\n\n"), classes.join("\n\n"), funcs.join("\n\n"), main].filter(x => x !== "").join("\n\n");
        return result;
    }
}