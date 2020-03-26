import { NewExpression, Identifier, TemplateString, ArrayLiteral, CastExpression, BooleanLiteral, StringLiteral, NumericLiteral, CharacterLiteral, PropertyAccessExpression, Expression, ElementAccessExpression, BinaryExpression, UnresolvedCallExpression, ConditionalExpression, InstanceOfExpression, ParenthesizedExpression, RegexLiteral, UnaryExpression, UnaryType, MapLiteral, NullLiteral, AwaitExpression, UnresolvedNewExpression, UnresolvedMethodCallExpression, InstanceMethodCallExpression, NullCoalesceExpression, GlobalFunctionCallExpression, StaticMethodCallExpression, LambdaCallExpression, IExpression } from "../One/Ast/Expressions";
import { Statement, ReturnStatement, UnsetStatement, ThrowStatement, ExpressionStatement, VariableDeclaration, BreakStatement, ForeachStatement, IfStatement, WhileStatement, ForStatement, DoStatement, ContinueStatement, ForVariable, TryStatement } from "../One/Ast/Statements";
import { Method, Block, Class, IClassMember, SourceFile, IMethodBase, Constructor, IVariable, Lambda, IImportable, UnresolvedImport, Interface, Enum, IInterface, Field, Property, MethodParameter, IVariableWithInitializer, Visibility, IAstNode, GlobalFunction } from "../One/Ast/Types";
import { Type, VoidType } from "../One/Ast/AstTypes";
import { ThisReference, EnumReference, ClassReference, MethodParameterReference, VariableDeclarationReference, ForVariableReference, ForeachVariableReference, SuperReference, StaticFieldReference, StaticPropertyReference, InstanceFieldReference, InstancePropertyReference, EnumMemberReference, CatchVariableReference, GlobalFunctionReference, StaticThisReference } from "../One/Ast/References";

export class TSOverviewGenerator {
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

    //static name_(obj: IMethodBase) { return `${obj instanceof Constructor ? "constructor" : obj.name}${this.typeArgs(obj.typeArguments)}`; }
    static typeArgs(args: string[]): string { return args !== null && args.length > 0 ? `<${args.join(", ")}>` : ""; }
    
    static type(t: Type, raw = false) {
        const repr = !t ? "???" : t.repr();
        if (repr === "U:UNKNOWN") debugger;
        return (raw ? "" : "{T}") + repr;
    }

    static var(v: IVariable) {
        let result = "";
        const isProp = v instanceof Property;
        if (v instanceof Field || v instanceof Property) {
            const m = <IClassMember>v;
            result += this.preIf("static ", m.isStatic);
            result += 
                m.visibility === Visibility.Private ? "private " : 
                m.visibility === Visibility.Protected ? "protected " :
                m.visibility === Visibility.Public ? "public " :
                "VISIBILITY-NOT-SET";
        }
        result += `${isProp ? "get " : ""}${v.name}${isProp ? "()" : ""}: ${this.type(v.type)}`;
        if (v instanceof VariableDeclaration || v instanceof ForVariable || v instanceof Field || v instanceof MethodParameter) {
            const init = (<IVariableWithInitializer>v).initializer;
            if (init !== null)
                result += this.pre(" = ", this.expr(init));
        }
        return result;
    }

    static expr(expr: IExpression, previewOnly = false): string {
        let res = "UNKNOWN-EXPR";
        if (expr instanceof NewExpression) {
            res = `new ${this.type(expr.cls)}(${previewOnly ? "..." : expr.args.map(x => this.expr(x)).join(", ")})`;
        } else if (expr instanceof UnresolvedNewExpression) {
            res = `new ${this.type(expr.cls)}(${previewOnly ? "..." : expr.args.map(x => this.expr(x)).join(", ")})`;
        } else if (expr instanceof Identifier) {
            res = `{ID}${expr.text}`;
        } else if (expr instanceof PropertyAccessExpression) {
            res = `${this.expr(expr.object)}.{PA}${expr.propertyName}`;
        } else if (expr instanceof UnresolvedCallExpression) {
            const typeArgs = expr.typeArgs.length > 0 ? `<${expr.typeArgs.map(x => this.type(x)).join(", ")}>` : "";
            res = `${this.expr(expr.func)}${typeArgs}(${previewOnly ? "..." : expr.args.map(x => this.expr(x)).join(", ")})`;
        } else if (expr instanceof UnresolvedMethodCallExpression) {
            const typeArgs = expr.typeArgs.length > 0 ? `<${expr.typeArgs.map(x => this.type(x)).join(", ")}>` : "";
            res = `${this.expr(expr.object)}.{UM}${expr.methodName}${typeArgs}(${previewOnly ? "..." : expr.args.map(x => this.expr(x)).join(", ")})`;
        } else if (expr instanceof InstanceMethodCallExpression) {
            const typeArgs = expr.typeArgs.length > 0 ? `<${expr.typeArgs.map(x => this.type(x)).join(", ")}>` : "";
            res = `${this.expr(expr.object)}.{M}${expr.method.name}${typeArgs}(${previewOnly ? "..." : expr.args.map(x => this.expr(x)).join(", ")})`;
        } else if (expr instanceof StaticMethodCallExpression) {
            const typeArgs = expr.typeArgs.length > 0 ? `<${expr.typeArgs.map(x => this.type(x)).join(", ")}>` : "";
            res = `${expr.method.parentInterface.name}.{M}${expr.method.name}${typeArgs}(${previewOnly ? "..." : expr.args.map(x => this.expr(x)).join(", ")})`;
        } else if (expr instanceof GlobalFunctionCallExpression) {
            res = `${expr.func.name}(${previewOnly ? "..." : expr.args.map(x => this.expr(x)).join(", ")})`;
        } else if (expr instanceof LambdaCallExpression) {
            res = `${this.expr(expr.method)}(${previewOnly ? "..." : expr.args.map(x => this.expr(x)).join(", ")})`;
        } else if (expr instanceof BooleanLiteral) {
            res = `${expr.boolValue}`;
        } else if (expr instanceof StringLiteral) { 
            res = `${JSON.stringify(expr.stringValue)}`;
        } else if (expr instanceof NumericLiteral) { 
            res = `${expr.valueAsText}`;
        } else if (expr instanceof CharacterLiteral) { 
            res = `'${expr.charValue}'`;
        } else if (expr instanceof ElementAccessExpression) {
            res = `(${this.expr(expr.object)})[${this.expr(expr.elementExpr)}]`;
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
            res = `(${expr.parameters.map(x => x.name + (x.type ? `: ${this.type(x.type)}` : "")).join(", ")}) => { ${this.rawBlock(expr.body)} }`;
        } else if (expr instanceof UnaryExpression && expr.unaryType === UnaryType.Prefix) {
            res = `${expr.operator}${this.expr(expr.operand)}`;
        } else if (expr instanceof UnaryExpression && expr.unaryType === UnaryType.Postfix) {
            res = `${this.expr(expr.operand)}${expr.operator}`;
        } else if (expr instanceof MapLiteral) {
            const repr = expr.items.map(item => `${item.key}: ${this.expr(item.value)}`).join(",\n");
            res = "{L:M}" + (repr === "" ? "{}" : repr.includes("\n") ? `{\n${this.pad(repr)}\n}` : `{ ${repr} }`);
        } else if (expr instanceof NullLiteral) {
            res = `null`;
        } else if (expr instanceof AwaitExpression) {
            res = `await ${this.expr(expr.expr)}`;
        } else if (expr instanceof ThisReference) {
            res = `{R}this`;
        } else if (expr instanceof StaticThisReference) {
            res = `{R:Static}this`;
        } else if (expr instanceof EnumReference) {
            res = `{R:Enum}${expr.decl.name}`;
        } else if (expr instanceof ClassReference) {
            res = `{R:Cls}${expr.decl.name}`;
        } else if (expr instanceof MethodParameterReference) {
            res = `{R:MetP}${expr.decl.name}`;
        } else if (expr instanceof VariableDeclarationReference) {
            res = `{V}${expr.decl.name}`;
        } else if (expr instanceof ForVariableReference) {
            res = `{R:ForV}${expr.decl.name}`;
        } else if (expr instanceof ForeachVariableReference) {
            res = `{R:ForEV}${expr.decl.name}`;
        } else if (expr instanceof CatchVariableReference) {
            res = `{R:CatchV}${expr.decl.name}`;
        } else if (expr instanceof GlobalFunctionReference) {
            res = `{R:GFunc}${expr.decl.name}`;
        } else if (expr instanceof SuperReference) {
            res = `{R}super`;
        } else if (expr instanceof StaticFieldReference) {
            res = `{R:StFi}${expr.decl.parentInterface.name}::${expr.decl.name}`;
        } else if (expr instanceof StaticPropertyReference) {
            res = `{R:StPr}${expr.decl.parentClass.name}::${expr.decl.name}`;
        } else if (expr instanceof InstanceFieldReference) {
            res = `${this.expr(expr.object)}.{F}${expr.field.name}`;
        } else if (expr instanceof InstancePropertyReference) {
            res = `${this.expr(expr.object)}.{P}${expr.property.name}`;
        } else if (expr instanceof EnumMemberReference) {
            res = `{E}${expr.decl.parentEnum.name}::${expr.decl.name}`;
        } else if (expr instanceof NullCoalesceExpression) {
            res = `${this.expr(expr.defaultExpr)} ?? ${this.expr(expr.exprIfNull)}`;
        } else debugger;
        return res;
    }

    static block(block: Block, previewOnly = false, allowOneLiner = true) {
        if (previewOnly) return " { ... }";
        const stmtLen = block.statements.length;
        return stmtLen === 0 ? " { }" : allowOneLiner && stmtLen === 1 ? `\n${this.pad(this.rawBlock(block))}` : ` {\n${this.pad(this.rawBlock(block))}\n}`;
    }

    static stmt(stmt: Statement, previewOnly = false): string {
        let res = "UNKNOWN-STATEMENT";
        if (stmt instanceof BreakStatement) {
            res = "break;";
        } else if (stmt instanceof ReturnStatement) {
            res = stmt.expression === null ? "return;" : `return ${this.expr(stmt.expression)};`;
        } else if (stmt instanceof UnsetStatement) {
            res = `unset ${this.expr(stmt.expression)};`;
        } else if (stmt instanceof ThrowStatement) {
            res = `throw ${this.expr(stmt.expression)};`;
        } else if (stmt instanceof ExpressionStatement) {
            res = `${this.expr(stmt.expression)};`;
        } else if (stmt instanceof VariableDeclaration) {
            res = `${stmt.isMutable ? "let" : "const"} ${this.var(stmt)};`;
        } else if (stmt instanceof ForeachStatement) {
            res = `for (const ${stmt.itemVar.name} of ${this.expr(stmt.items)})` + this.block(stmt.body, previewOnly);
        } else if (stmt instanceof IfStatement) {
            const elseIf = stmt.else_ !== null && stmt.else_.statements.length === 1 && stmt.else_.statements[0] instanceof IfStatement;
            res = `if (${this.expr(stmt.condition)})${this.block(stmt.then, previewOnly)}`;
            if (!previewOnly)
                res += (elseIf ? `\nelse ${this.stmt(stmt.else_.statements[0])}` : "") +
                    (!elseIf && stmt.else_ !== null ? `\nelse` + this.block(stmt.else_) : "");
        } else if (stmt instanceof WhileStatement) {
            res = `while (${this.expr(stmt.condition)})` + this.block(stmt.body, previewOnly);
        } else if (stmt instanceof ForStatement) {
            res = `for (${stmt.itemVar !== null ? this.var(stmt.itemVar) : ""}; ${this.expr(stmt.condition)}; ${this.expr(stmt.incrementor)})` + this.block(stmt.body, previewOnly);
        } else if (stmt instanceof DoStatement) {
            res = `do${this.block(stmt.body, previewOnly)} while (${this.expr(stmt.condition)})`;
        } else if (stmt instanceof TryStatement) {
            res = "try" + this.block(stmt.tryBody, previewOnly, false) +
                (stmt.catchBody !== null ? ` catch (${stmt.catchVar.name})${this.block(stmt.catchBody, previewOnly)}` : "") +
                (stmt.finallyBody !== null ? "finally" + this.block(stmt.finallyBody, previewOnly) : "");
        } else if (stmt instanceof ContinueStatement) {
            res = `continue;`;
        } else debugger;
        return previewOnly ? res : this.leading(stmt) + res;
    }

    static rawBlock(block: Block): string { return block.statements.map(stmt => this.stmt(stmt)).join("\n"); }

    static methodBase(method: IMethodBase, returns: Type = new VoidType()): string {
        if (method === null) return "";
        const name = method instanceof Method ? method.name : method instanceof Constructor ? "constructor" : method instanceof GlobalFunction ? method.name : "???";
        const typeArgs = method instanceof Method ? method.typeArguments : null;
        return this.preIf("/* throws */ ", method.throws) + 
            `${name}${this.typeArgs(typeArgs)}(${method.parameters.map(p => this.var(p)).join(", ")})` +
            (returns instanceof VoidType ? "" : `: ${this.type(returns)}`) +
            (method.body ? ` {\n${this.pad(this.rawBlock(method.body))}\n}` : ";");
    }

    static method(method: Method) {
        return method === null ? "" : `${method.isStatic ? "static " : ""}${method.mutates ? "/* mutates */ " : ""}${this.methodBase(method, method.returns)}`;
    }

    static classLike(cls: IInterface) {
        const resList: string[] = [];
        if (cls instanceof Class) {
            resList.push(cls.fields.map(field => this.var(field) + ';').join("\n"));
            resList.push(cls.properties.map(prop => this.var(prop) + ';').join("\n"));
            resList.push(this.methodBase(cls.constructor_));
        }
        resList.push(cls.methods.map(method => this.method(method)).join("\n\n"));
        return this.pad(resList.filter(x => x !== "").join("\n\n"));
    }

    static pad(str: string): string { return str.split(/\n/g).map(x => `    ${x}`).join('\n'); }
    static imp(imp: IImportable) { return "" + 
        (imp instanceof UnresolvedImport ? "X" : imp instanceof Class ? "C" : imp instanceof Interface ? "I" : imp instanceof Enum ? "E" : "???") +
        `:${imp.name}`; }

    static nodeRepr(node: IAstNode): string {
        if (node instanceof Statement)
            return this.stmt(node, true);
        else if (node instanceof Expression)
            return this.expr(node, true);
        else
            debugger;
    }

    static generate(sourceFile: SourceFile) {
        const imps = sourceFile.imports.map(imp => (imp.importAll ? `import * as ${imp.importAs}` : `import { ${imp.imports.map(x => this.imp(x)).join(", ")} }`) +
            ` from "${imp.exportScope.packageName}${this.pre("/", imp.exportScope.scopeName)}";`);
        const enums = sourceFile.enums.map(enum_ => `enum ${enum_.name} { ${enum_.values.map(x => x.name).join(", ")} }`);
        const intfs = sourceFile.interfaces.map(intf => `interface ${intf.name}${this.typeArgs(intf.typeArguments)}`+
            `${this.preArr(" extends ", intf.baseInterfaces.map(x => this.type(x)))} {\n${this.classLike(intf)}\n}`);
        const classes = sourceFile.classes.map(cls => `class ${cls.name}${this.typeArgs(cls.typeArguments)}`+
            this.pre(" extends ", cls.baseClass ? this.type(cls.baseClass) : null) + 
            this.preArr(" implements ", cls.baseInterfaces.map(x => this.type(x))) + 
            ` {\n${this.classLike(cls)}\n}`);
        const funcs = sourceFile.funcs.map(func => `function ${func.name}${this.methodBase(func, func.returns)}`);
        const main = this.rawBlock(sourceFile.mainBlock);
        const result = `// export scope: ${sourceFile.exportScope.packageName}/${sourceFile.exportScope.scopeName}\n`+
            [imps.join("\n"), enums.join("\n"), intfs.join("\n\n"), classes.join("\n\n"), funcs.join("\n\n"), main].filter(x => x !== "").join("\n\n");
        return result;
    }
}