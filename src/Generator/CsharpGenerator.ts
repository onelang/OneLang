import { NewExpression, Identifier, TemplateString, ArrayLiteral, CastExpression, BooleanLiteral, StringLiteral, NumericLiteral, CharacterLiteral, PropertyAccessExpression, Expression, ElementAccessExpression, BinaryExpression, UnresolvedCallExpression, ConditionalExpression, InstanceOfExpression, ParenthesizedExpression, RegexLiteral, UnaryExpression, UnaryType, MapLiteral, NullLiteral, AwaitExpression, UnresolvedNewExpression, UnresolvedMethodCallExpression, InstanceMethodCallExpression, NullCoalesceExpression, GlobalFunctionCallExpression, StaticMethodCallExpression, LambdaCallExpression, IExpression, IMethodCallExpression } from "../One/Ast/Expressions";
import { Statement, ReturnStatement, UnsetStatement, ThrowStatement, ExpressionStatement, VariableDeclaration, BreakStatement, ForeachStatement, IfStatement, WhileStatement, ForStatement, DoStatement, ContinueStatement, ForVariable, TryStatement } from "../One/Ast/Statements";
import { Method, Block, Class, IClassMember, SourceFile, IMethodBase, Constructor, IVariable, Lambda, IImportable, UnresolvedImport, Interface, Enum, IInterface, Field, Property, MethodParameter, IVariableWithInitializer, Visibility, IAstNode, GlobalFunction, Package, SourcePath, IHasAttributesAndTrivia } from "../One/Ast/Types";
import { Type, VoidType, ClassType, InterfaceType, EnumType, AnyType, LambdaType, NullType, GenericsType } from "../One/Ast/AstTypes";
import { ThisReference, EnumReference, ClassReference, MethodParameterReference, VariableDeclarationReference, ForVariableReference, ForeachVariableReference, SuperReference, StaticFieldReference, StaticPropertyReference, InstanceFieldReference, InstancePropertyReference, EnumMemberReference, CatchVariableReference, GlobalFunctionReference, StaticThisReference, Reference, VariableReference } from "../One/Ast/References";
import { InferTypes } from "../One/Transforms/InferTypes";

export class GeneratedFile {
    constructor(public path: string, public content: string) { }
}

export class CsharpGenerator {
    usings: Set<string>;
    currentClass: IInterface;
    reservedWords = ["object", "else", "operator", "class", "enum", "void", "string", "implicit", "Type", "Enum", "params", "using", "throw", "ref", "base", "virtual", "interface", "int", "const"];
    fieldToMethodHack = ["length"];
    instanceOfIds: { [name: string]: number } = {};

    name_(name: string) {
        if (this.reservedWords.includes(name)) name += "_";
        if (this.fieldToMethodHack.includes(name)) name += "()";
        const nameParts = name.split(/-/g);
        for (let i = 1; i < nameParts.length; i++)
            nameParts[i] = nameParts[i][0].toUpperCase() + nameParts[i].substr(1);
        name = nameParts.join('');
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
    typeArgs2(args: Type[]): string { return this.typeArgs(args.map(x => this.type(x))); }

    type(t: Type, mutates = true): string {
        if (t instanceof ClassType) {
            const typeArgs = this.typeArgs(t.typeArguments.map(x => this.type(x)));
            if (t.decl.name === "TsString")
                return "string";
            else if (t.decl.name === "TsBoolean")
                return "bool";
            else if (t.decl.name === "TsNumber")
                return "int";
            else if (t.decl.name === "TsArray") {
                if (mutates) {
                    this.usings.add("System.Collections.Generic");
                    return `List<${this.type(t.typeArguments[0])}>`;
                } else
                    return `${this.type(t.typeArguments[0])}[]`;
            } else if (t.decl.name === "Promise") {
                this.usings.add("System.Threading.Tasks");
                return t.typeArguments[0] instanceof VoidType ? "Task"  : `Task${typeArgs}`;
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

    isTsArray(type: Type) { return type instanceof ClassType && type.decl.name == "TsArray"; }

    vis(v: Visibility) {
        return v === Visibility.Private ? "private" :
               v === Visibility.Protected ? "protected" :
               v === Visibility.Public ? "public" :
               "/* TODO: not set */public";
    }

    varWoInit(v: IVariable, attr: IHasAttributesAndTrivia) {
        let type: string;
        if (attr !== null && attr.attributes !== null && "csharp-type" in attr.attributes)
            type = attr.attributes["csharp-type"];
        else if (v.type instanceof ClassType && v.type.decl.name === "TsArray") {
            if (v.mutability.mutated) {
                this.usings.add("System.Collections.Generic");
                type = `List<${this.type(v.type.typeArguments[0])}>`;
            } else {
                type = `${this.type(v.type.typeArguments[0])}[]`;
            }
        } else {
            type = this.type(v.type);
        }
        return `${type} ${this.name_(v.name)}`;
    }

    var(v: IVariableWithInitializer, attrs: IHasAttributesAndTrivia) {
        return `${this.varWoInit(v, attrs)}${v.initializer !== null ? ` = ${this.expr(v.initializer)}` : ""}`;
    }

    exprCall(typeArgs: Type[], args: Expression[]) {
        return this.typeArgs2(typeArgs) + `(${args.map(x => this.expr(x)).join(", ")})`;
    }

    mutateArg(arg: Expression, shouldBeMutable: boolean) {
        if (this.isTsArray(arg.actualType)) {
            if (arg instanceof ArrayLiteral && !shouldBeMutable) {
                const itemType = (<ClassType>arg.actualType).typeArguments[0];
                return arg.items.length === 0 && !this.isTsArray(itemType) ? `new ${this.type(itemType)}[0]` : 
                    `new ${this.type(itemType)}[] { ${arg.items.map(x => this.expr(x)).join(', ')} }`;
            }

            let currentlyMutable = shouldBeMutable;
            if (arg instanceof VariableReference)
                currentlyMutable = arg.getVariable().mutability.mutated;
            else if (arg instanceof InstanceMethodCallExpression || arg instanceof StaticMethodCallExpression)
                currentlyMutable = false;
            
            if (currentlyMutable && !shouldBeMutable)
                return `${this.expr(arg)}.ToArray()`;
            else if (!currentlyMutable && shouldBeMutable) {
                this.usings.add("System.Linq");
                return `${this.expr(arg)}.ToList()`;
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

    inferExprNameForType(type: Type): string {
        if (type instanceof ClassType && type.typeArguments.every((x,_) => x instanceof ClassType)) {
            const fullName = type.typeArguments.map(x => (<ClassType>x).decl.name).join('') + type.decl.name;
            const nameParts: string[] = [];
            let partStartIdx = 0;
            for (let i = 1; i < fullName.length; i++) {
                const chrCode = fullName.charCodeAt(i);
                const chrIsUpper = 65 <= chrCode && chrCode <= 90;
                if (chrIsUpper) {
                    nameParts.push(fullName.substring(partStartIdx, i));
                    partStartIdx = i;
                }
            }
            nameParts.push(fullName.substr(partStartIdx));

            const shortNameParts: string[] = [];
            for (let i = 0; i < nameParts.length; i++) {
                let p = nameParts[i];
                if (p.length > 5) {
                    let cutPoint = 3;
                    for (; cutPoint <= 4; cutPoint++)
                        if ("aeoiu".includes(p[cutPoint]))
                            break;
                    p = p.substr(0, cutPoint);
                }
                shortNameParts.push(i === 0 ? p.toLowerCase() : p);
            }
            return shortNameParts.join('');
        }
        return null;
    }

    expr(expr: IExpression): string {
        let res = "UNKNOWN-EXPR";
        if (expr instanceof NewExpression) {
            res = `new ${this.type(expr.cls)}${this.callParams(expr.args, expr.cls.decl.constructor_ !== null ? expr.cls.decl.constructor_.parameters : [])}`;
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
            res = `${this.expr(expr.method)}(${expr.args.map(x => this.expr(x)).join(", ")})`;
        } else if (expr instanceof BooleanLiteral) {
            res = `${expr.boolValue ? "true" : "false"}`;
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
                // parts.push(part.literalText.replace(new RegExp("\\n"), $"\\n").replace(new RegExp("\\r"), $"\\r").replace(new RegExp("\\t"), $"\\t").replace(new RegExp("{"), "{{").replace(new RegExp("}"), "}}").replace(new RegExp("\""), $"\\\""));
                if (part.isLiteral) {
                    let lit = "";
                    for (let i = 0; i < part.literalText.length; i++) {
                        const chr = part.literalText[i];
                        if (chr === '\n')      lit += "\\n";
                        else if (chr === '\r') lit += "\\r";
                        else if (chr === '\t') lit += "\\t";
                        else if (chr === '\\') lit += "\\\\";
                        else if (chr === '"')  lit += '\\"';
                        else if (chr === '{')  lit += "{{";
                        else if (chr === '}')  lit += "}}";
                        else {
                            const chrCode = chr.charCodeAt(0);
                            if (32 <= chrCode && chrCode <= 126)
                                lit += chr;
                            else
                                throw new Error(`invalid char in template string (code=${chrCode})`);
                        }
                    }
                    parts.push(lit);
                }
                else {
                    const repr = this.expr(part.expression);
                    parts.push(part.expression instanceof ConditionalExpression ? `{(${repr})}` : `{${repr}}`);
                }
            }
            res = `$"${parts.join('')}"`;
        } else if (expr instanceof BinaryExpression) {
            res = `${this.expr(expr.left)} ${expr.operator} ${this.mutatedExpr(expr.right, expr.operator === "=" ? expr.left : null)}`;
        } else if (expr instanceof ArrayLiteral) {
            if (expr.items.length === 0) {
                res = `new ${this.type(expr.actualType)}()`;
            } else
                res = `new ${this.type(expr.actualType)} { ${expr.items.map(x => this.expr(x)).join(', ')} }`;
        } else if (expr instanceof CastExpression) {
            if (expr.instanceOfCast !== null && expr.instanceOfCast.alias !== null)
                res = this.name_(expr.instanceOfCast.alias);
            else
                res = `((${this.type(expr.newType)})${this.expr(expr.expression)})`;
        } else if (expr instanceof ConditionalExpression) {
            res = `${this.expr(expr.condition)} ? ${this.expr(expr.whenTrue)} : ${this.mutatedExpr(expr.whenFalse, expr.whenTrue)}`;
        } else if (expr instanceof InstanceOfExpression) {
            if (expr.implicitCasts !== null && expr.implicitCasts.length > 0) {
                let aliasPrefix = this.inferExprNameForType(expr.checkType);
                if (aliasPrefix === null)
                    aliasPrefix = expr.expr instanceof VariableReference ? expr.expr.getVariable().name : "obj";
                const id = aliasPrefix in this.instanceOfIds ? this.instanceOfIds[aliasPrefix] : 1;
                this.instanceOfIds[aliasPrefix] = id + 1;
                expr.alias = `${aliasPrefix}${id === 1 ? "" : `${id}`}`;
            }
            res = `${this.expr(expr.expr)} is ${this.type(expr.checkType)}${expr.alias !== null ? ` ${this.name_(expr.alias)}` : ""}`;
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
            res = `${this.expr(expr.defaultExpr)} ?? ${this.mutatedExpr(expr.exprIfNull, expr.defaultExpr)}`;
        } else debugger;
        return res;
    }

    block(block: Block, allowOneLiner = true): string {
        const stmtLen = block.statements.length;
        return stmtLen === 0 ? " { }" : allowOneLiner && stmtLen === 1 && !(block.statements[0] instanceof IfStatement) ? 
            `\n${this.pad(this.rawBlock(block))}` : ` {\n${this.pad(this.rawBlock(block))}\n}`;
    }

    stmt(stmt: Statement): string {
        let res = "UNKNOWN-STATEMENT";
        if (stmt.attributes !== null && "csharp" in stmt.attributes) {
            res = stmt.attributes["csharp"];
        } else if (stmt instanceof BreakStatement) {
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
            res = `for (${stmt.itemVar !== null ? this.var(stmt.itemVar, null) : ""}; ${this.expr(stmt.condition)}; ${this.expr(stmt.incrementor)})` + this.block(stmt.body);
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

    stmts(stmts: Statement[]): string { return stmts.map(stmt => this.stmt(stmt)).join("\n"); }
    rawBlock(block: Block): string { return this.stmts(block.statements); }

    classLike(cls: IInterface) {
        this.currentClass = cls;
        const resList: string[] = [];

        const staticConstructorStmts: Statement[] = [];
        const complexFieldInits: Statement[] = [];
        if (cls instanceof Class) {
            resList.push(cls.fields.map(field => {
                const isInitializerComplex = field.initializer !== null && 
                    !(field.initializer instanceof StringLiteral) && 
                    !(field.initializer instanceof BooleanLiteral) && 
                    !(field.initializer instanceof NumericLiteral);

                const prefix = `${this.vis(field.visibility)} ${this.preIf("static ", field.isStatic)}`;
                if (field.interfaceDeclarations.length > 0)
                    return `${prefix}${this.varWoInit(field, field)} { get; set; }`;
                else if (isInitializerComplex) {
                    if (field.isStatic)
                        staticConstructorStmts.push(new ExpressionStatement(new BinaryExpression(new StaticFieldReference(field), "=", field.initializer)));
                    else
                        complexFieldInits.push(new ExpressionStatement(new BinaryExpression(new InstanceFieldReference(new ThisReference(cls), field), "=", field.initializer)));
                    
                        return `${prefix}${this.varWoInit(field, field)};`;
                } else
                    return `${prefix}${this.var(field, field)};`;
            }).join("\n"));

            resList.push(cls.properties.map(prop => {
                return `${this.vis(prop.visibility)} ${this.preIf("static ", prop.isStatic)}` +
                    this.varWoInit(prop, prop) +
                    (prop.getter !== null ? ` {\n    get {\n${this.pad(this.block(prop.getter))}\n    }\n}` : "") +
                    (prop.setter !== null ? ` {\n    set {\n${this.pad(this.block(prop.setter))}\n    }\n}` : "");
            }).join("\n"));

            if (staticConstructorStmts.length > 0)
                resList.push(`static ${this.name_(cls.name)}()\n{\n${this.pad(this.stmts(staticConstructorStmts))}\n}`);

            if (cls.constructor_ !== null) {
                const constrFieldInits: Statement[] = cls.fields.filter(x => x.constructorParam !== null)
                    .map(field => {
                        const fieldRef = new InstanceFieldReference(new ThisReference(cls), field);
                        const mpRef = new MethodParameterReference(field.constructorParam);
                        // TODO: decide what to do with "after-TypeEngine" transformations
                        mpRef.setActualType(field.type, false, false);
                        return new ExpressionStatement(new BinaryExpression(fieldRef, "=", mpRef));
                    });

                resList.push(
                    "public " +
                    this.preIf("/* throws */ ", cls.constructor_.throws) + 
                    this.name_(cls.name) +
                    `(${cls.constructor_.parameters.map(p => this.var(p, null)).join(", ")})` +
                    (cls.constructor_.superCallArgs !== null ? `: base(${cls.constructor_.superCallArgs.map(x => this.expr(x)).join(", ")})` : "") +
                    `\n{\n${this.pad(this.stmts(constrFieldInits.concat(complexFieldInits).concat(cls.constructor_.body.statements)))}\n}`);
            } else if (complexFieldInits.length > 0)
                resList.push(`public ${this.name_(cls.name)}()\n{\n${this.pad(this.stmts(complexFieldInits))}\n}`);

        } else if (cls instanceof Interface) {
            resList.push(cls.fields.map(field => `${this.varWoInit(field, field)} { get; set; }`).join("\n"));
        }

        const methods: string[] = [];
        for (const method of cls.methods) {
            if (cls instanceof Class && method.body === null) continue; // declaration only
            methods.push(
                (method.parentInterface instanceof Interface ? "" : this.vis(method.visibility) + " ") +
                this.preIf("static ", method.isStatic) +
                this.preIf("virtual ", method.overrides === null && method.overriddenBy.length > 0) + 
                this.preIf("override ", method.overrides !== null) +
                this.preIf("async ", method.async) +
                this.preIf("/* throws */ ", method.throws) +
                `${this.type(method.returns, false)} ` +
                this.name_(method.name) + this.typeArgs(method.typeArguments) + 
                `(${method.parameters.map(p => this.var(p, null)).join(", ")})` +
                (method.body !== null ? ` {\n${this.pad(this.stmts(method.body.statements))}\n}` : ";"));
        }
        resList.push(methods.join("\n\n"));
        return this.pad(resList.filter(x => x !== "").join("\n\n"));
    }

    pad(str: string): string { return str.split(/\n/g).map(x => `    ${x}`).join('\n'); }

    pathToNs(path: string): string {
        // Generator/ExprLang/ExprLangAst.ts -> Generator.ExprLang
        const parts = path.split(/\//g);
        parts.pop();
        return parts.join('.');
    }

    genFile(sourceFile: SourceFile): string {
        this.instanceOfIds = {};
        this.usings = new Set<string>();
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

    generate(pkg: Package): GeneratedFile[] {
        const result: GeneratedFile[] = [];
        for (const path of Object.keys(pkg.files))
            result.push(new GeneratedFile(path, this.genFile(pkg.files[path])));
        return result;
    }
}