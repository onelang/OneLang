import { NewExpression, Identifier, TemplateString, ArrayLiteral, CastExpression, BooleanLiteral, StringLiteral, NumericLiteral, CharacterLiteral, PropertyAccessExpression, Expression, ElementAccessExpression, BinaryExpression, UnresolvedCallExpression, ConditionalExpression, InstanceOfExpression, ParenthesizedExpression, RegexLiteral, UnaryExpression, UnaryType, MapLiteral, NullLiteral, AwaitExpression, UnresolvedNewExpression, UnresolvedMethodCallExpression, InstanceMethodCallExpression, NullCoalesceExpression, GlobalFunctionCallExpression, StaticMethodCallExpression, LambdaCallExpression, IMethodCallExpression } from "../One/Ast/Expressions";
import { Statement, ReturnStatement, UnsetStatement, ThrowStatement, ExpressionStatement, VariableDeclaration, BreakStatement, ForeachStatement, IfStatement, WhileStatement, ForStatement, DoStatement, ContinueStatement, TryStatement, Block } from "../One/Ast/Statements";
import { Class, SourceFile, IVariable, Lambda, Interface, IInterface, MethodParameter, IVariableWithInitializer, Visibility, Package, IHasAttributesAndTrivia, Enum } from "../One/Ast/Types";
import { VoidType, ClassType, InterfaceType, EnumType, AnyType, LambdaType, NullType, GenericsType } from "../One/Ast/AstTypes";
import { ThisReference, EnumReference, ClassReference, MethodParameterReference, VariableDeclarationReference, ForVariableReference, ForeachVariableReference, SuperReference, StaticFieldReference, StaticPropertyReference, InstanceFieldReference, InstancePropertyReference, EnumMemberReference, CatchVariableReference, GlobalFunctionReference, StaticThisReference, VariableReference } from "../One/Ast/References";
import { GeneratedFile } from "./GeneratedFile";
import { NameUtils } from "./NameUtils";
import { IGenerator } from "./IGenerator";
import { IExpression, IType } from "../One/Ast/Interfaces";
import { IGeneratorPlugin } from "./IGeneratorPlugin";
import { ITransformer } from "../One/ITransformer";
import { ExpressionValue, LambdaValue, TemplateFileGeneratorPlugin } from "./TemplateFileGeneratorPlugin";
import { IVMValue, StringValue } from "../VM/Values";

export class PhpGenerator implements IGenerator {
    usings: Set<string>;
    currentClass: IInterface;
    reservedWords: string[] = ["Generator", "Array", "List", "Interface", "Class"];
    fieldToMethodHack = ["length"];
    plugins: IGeneratorPlugin[] = [];

    getLangName(): string { return "PHP"; }
    getExtension(): string { return "php"; }
    getTransforms(): ITransformer[] { return []; }
    addInclude(include: string): void { this.usings.add(include); }

    addPlugin(plugin: IGeneratorPlugin) {
        this.plugins.push(plugin);

        // TODO: hack?
        if (plugin instanceof TemplateFileGeneratorPlugin) {
            plugin.modelGlobals["escape"] = new LambdaValue(args => new StringValue(this.escape(args[0])));
            plugin.modelGlobals["escapeBackslash"] = new LambdaValue(args => new StringValue(this.escapeBackslash(args[0])));
        }
    }

    escape(value: IVMValue): string {
        if (value instanceof ExpressionValue && value.value instanceof RegexLiteral)
            return JSON.stringify("/" + value.value.pattern.replace(/\//g, "\\/") + "/");
        else if (value instanceof ExpressionValue && value.value instanceof StringLiteral)
            return JSON.stringify(value.value.stringValue);
        else if (value instanceof StringValue)
            return JSON.stringify(value.value);
        throw new Error(`Not supported VMValue for escape()`);
    }

    escapeBackslash(value: IVMValue): string {
        if (value instanceof ExpressionValue && value.value instanceof StringLiteral)
            return JSON.stringify(value.value.stringValue.replace(/\\/g, "\\\\"));
        throw new Error(`Not supported VMValue for escape()`);
    }

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
    typeArgs2(args: IType[]): string { return this.typeArgs(args.map(x => this.type(x))); }

    type(t: IType, mutates = true): string {
        if (t instanceof ClassType) {
            //const typeArgs = this.typeArgs(t.typeArguments.map(x => this.type(x)));
            if (t.decl.name === "TsString")
                return "string";
            else if (t.decl.name === "TsBoolean")
                return "bool";
            else if (t.decl.name === "TsNumber")
                return "int";
            else if (t.decl.name === "TsArray") {
                if (mutates) {
                    return `List_`;
                } else
                    return `${this.type(t.typeArguments[0])}[]`;
            } else if (t.decl.name === "Promise") {
                return this.type(t.typeArguments[0]);
                //return t.typeArguments[0] instanceof VoidType ? "Task"  : `Task${typeArgs}`;
            } else if (t.decl.name === "Object") {
                //this.usings.add("System");
                return `object`;
            } else if (t.decl.name === "TsMap") {
                return `Dictionary`;
            }
            
            if (t.decl.parentFile.exportScope === null)
                return `\\OneLang\\Core\\${this.name_(t.decl.name)}`;
            else
                return this.name_(t.decl.name);
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
            const paramTypes = t.parameters.map(x => this.type(x.type));
            if (isFunc)
                paramTypes.push(this.type(t.returnType));
            return `${isFunc ? "Func" : "Action"}<${paramTypes.join(", ")}>`;
        } else if (t === null) {
            return "/* TODO */ object";
        } else {
            debugger;
            return "/* MISSING */";
        }
    }

    isTsArray(type: IType) { return type instanceof ClassType && type.decl.name == "TsArray"; }

    vis(v: Visibility, isProperty: boolean) {
        return v === Visibility.Private ? "private " :
               v === Visibility.Protected ? "protected " :
               v === Visibility.Public ? (isProperty ? "public " : "") :
               "/* TODO: not set */" + (isProperty ? "public " : "");
    }

    varWoInit(v: IVariable, attr: IHasAttributesAndTrivia) {
        // let type: string;
        // if (attr !== null && attr.attributes !== null && "php-type" in attr.attributes)
        //     type = attr.attributes["php-type"];
        // else if (v.type instanceof ClassType && v.type.decl.name === "TsArray") {
        //     if (v.mutability.mutated) {
        //         type = `List<${this.type(v.type.typeArguments[0])}>`;
        //     } else {
        //         type = `${this.type(v.type.typeArguments[0])}[]`;
        //     }
        // } else {
        //     type = this.type(v.type);
        // }
        return `$${this.name_(v.name)}`;
    }

    var(v: IVariableWithInitializer, attrs: IHasAttributesAndTrivia) {
        return this.varWoInit(v, attrs) + (v.initializer !== null ? ` = ${this.expr(v.initializer)}` : "");
    }

    exprCall(typeArgs: IType[], args: Expression[]) {
        return this.typeArgs2(typeArgs) + `(${args.map(x => this.expr(x)).join(", ")})`;
    }

    mutateArg(arg: Expression, shouldBeMutable: boolean) {
        // if (this.isTsArray(arg.actualType)) {
        //     if (arg instanceof ArrayLiteral && !shouldBeMutable) {
        //         return `Array(${arg.items.map(x => this.expr(x)).join(', ')})`;
        //     }

        //     let currentlyMutable = shouldBeMutable;
        //     if (arg instanceof VariableReference)
        //         currentlyMutable = arg.getVariable().mutability.mutated;
        //     else if (arg instanceof InstanceMethodCallExpression || arg instanceof StaticMethodCallExpression)
        //         currentlyMutable = false;
            
        //     if (currentlyMutable && !shouldBeMutable)
        //         return `${this.expr(arg)}.ToArray()`;
        //     else if (!currentlyMutable && shouldBeMutable) {
        //         return `${this.expr(arg)}.ToList()`;
        //     }
        // }
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

    expr(expr: IExpression): string {
        for (const plugin of this.plugins) {
            const result = plugin.expr(expr);
            if (result !== null)
                return result;
        }

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
            res = `/* TODO: UnresolvedMethodCallExpression */ ${this.expr(expr.object)}->${expr.methodName}${this.exprCall(expr.typeArgs, expr.args)}`;
        } else if (expr instanceof InstanceMethodCallExpression) {
            if (expr.object instanceof SuperReference)
                res = `parent::${this.methodCall(expr)}`;
            else if (expr.object instanceof NewExpression) {
                res = `(${this.expr(expr.object)})->${this.methodCall(expr)}`;
            } else
                res = `${this.expr(expr.object)}->${this.methodCall(expr)}`;
        } else if (expr instanceof StaticMethodCallExpression) {
            res = `${this.name_(expr.method.parentInterface.name)}::${this.methodCall(expr)}`;
            if (expr.method.parentInterface.parentFile.exportScope === null)
                res = `\\OneLang\\Core\\${res}`;
        } else if (expr instanceof GlobalFunctionCallExpression) {
            res = `${this.name_(expr.func.name)}${this.exprCall([], expr.args)}`;
        } else if (expr instanceof LambdaCallExpression) {
            res = `call_user_func(${this.expr(expr.method)}, ${expr.args.map(x => this.expr(x)).join(", ")})`;
        } else if (expr instanceof BooleanLiteral) {
            res = `${expr.boolValue ? "true" : "false"}`;
        } else if (expr instanceof StringLiteral) {
            res = JSON.stringify(expr.stringValue).replace(/\$/g, "\\$");
        } else if (expr instanceof NumericLiteral) { 
            res = expr.valueAsText;
        } else if (expr instanceof CharacterLiteral) { 
            res = `'${expr.charValue}'`;
        } else if (expr instanceof ElementAccessExpression) {
            res = `${this.expr(expr.object)}[${this.expr(expr.elementExpr)}]`;
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
                        else if (chr === '$') lit += "\\$";
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
                    const isComplex = part.expression instanceof ConditionalExpression ||
                        part.expression instanceof BinaryExpression ||
                        part.expression instanceof NullCoalesceExpression;
                    parts.push(isComplex ? `(${repr})` : repr);
                }
            }
            res = parts.join(' . ');
        } else if (expr instanceof BinaryExpression) {
            let op = expr.operator;
            if (op === "==")
                op = "===";
            else if (op === "!=")
                op = "!==";
            
            if (expr.left.actualType !== null && expr.left.actualType.repr() === "C:TsString") {
                if (op === "+")
                    op = ".";
                else if (op === "+=")
                    op = ".=";
            }

            // const useParen = expr.left instanceof BinaryExpression && expr.left.operator !== expr.operator;
            // const leftExpr = this.expr(expr.left);

            res = `${this.expr(expr.left)} ${op} ${this.mutatedExpr(expr.right, expr.operator === "=" ? expr.left : null)}`;
        } else if (expr instanceof ArrayLiteral) {
            res = `array(${expr.items.map(x => this.expr(x)).join(', ')})`;
        } else if (expr instanceof CastExpression) {
            res = `${this.expr(expr.expression)}`;
        } else if (expr instanceof ConditionalExpression) {
            let whenFalseExpr = this.expr(expr.whenFalse);
            if (expr.whenFalse instanceof ConditionalExpression)
                whenFalseExpr = `(${whenFalseExpr})`;
            res = `${this.expr(expr.condition)} ? ${this.expr(expr.whenTrue)} : ${whenFalseExpr}`;
        } else if (expr instanceof InstanceOfExpression) {
            res = `${this.expr(expr.expr)} instanceof ${this.type(expr.checkType)}`;
        } else if (expr instanceof ParenthesizedExpression) {
            res = `(${this.expr(expr.expression)})`;
        } else if (expr instanceof RegexLiteral) {
            res = `new \\OneLang\\Core\\RegExp(${JSON.stringify(expr.pattern)})`;
        } else if (expr instanceof Lambda) {
            const params = expr.parameters.map(x => `$${this.name_(x.name)}`);
            // TODO: captures should not be null
            const uses = expr.captures !== null && expr.captures.length > 0 ? ` use (${expr.captures.map(x => `$${x.name}`).join(", ")})` : "";
            res = `function (${params.join(", ")})${uses} { ${this.rawBlock(expr.body)} }`;
        } else if (expr instanceof UnaryExpression && expr.unaryType === UnaryType.Prefix) {
            res = `${expr.operator}${this.expr(expr.operand)}`;
        } else if (expr instanceof UnaryExpression && expr.unaryType === UnaryType.Postfix) {
            res = `${this.expr(expr.operand)}${expr.operator}`;
        } else if (expr instanceof MapLiteral) {
            const repr = expr.items.map(item => `${JSON.stringify(item.key)} => ${this.expr(item.value)}`).join(",\n");
            res = "Array(" + (repr === "" ? "" : repr.includes("\n") ? `\n${this.pad(repr)}\n` : repr) + ")";
        } else if (expr instanceof NullLiteral) {
            res = `null`;
        } else if (expr instanceof AwaitExpression) {
            res = `${this.expr(expr.expr)}`;
        } else if (expr instanceof ThisReference) {
            res = `$this`;
        } else if (expr instanceof StaticThisReference) {
            res = `${this.currentClass.name}`;
        } else if (expr instanceof EnumReference) {
            res = `${this.name_(expr.decl.name)}`;
        } else if (expr instanceof ClassReference) {
            res = `${this.name_(expr.decl.name)}`;
        } else if (expr instanceof MethodParameterReference) {
            res = `$${this.name_(expr.decl.name)}`;
        } else if (expr instanceof VariableDeclarationReference) {
            res = `$${this.name_(expr.decl.name)}`;
        } else if (expr instanceof ForVariableReference) {
            res = `$${this.name_(expr.decl.name)}`;
        } else if (expr instanceof ForeachVariableReference) {
            res = `$${this.name_(expr.decl.name)}`;
        } else if (expr instanceof CatchVariableReference) {
            res = `$${this.name_(expr.decl.name)}`;
        } else if (expr instanceof GlobalFunctionReference) {
            res = `${this.name_(expr.decl.name)}`;
        } else if (expr instanceof SuperReference) {
            res = `parent`;
        } else if (expr instanceof StaticFieldReference) {
            res = `${this.name_(expr.decl.parentInterface.name)}::$${this.name_(expr.decl.name)}`;
        } else if (expr instanceof StaticPropertyReference) {
            res = `${this.name_(expr.decl.parentClass.name)}::get_${this.name_(expr.decl.name)}()`;
        } else if (expr instanceof InstanceFieldReference) {
            res = `${this.expr(expr.object)}->${this.name_(expr.field.name)}`;
        } else if (expr instanceof InstancePropertyReference) {
            res = `${this.expr(expr.object)}->get_${this.name_(expr.property.name)}()`;
        } else if (expr instanceof EnumMemberReference) {
            res = `${this.name_(expr.decl.parentEnum.name)}::${this.enumMemberName(expr.decl.name)}`;
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

    stmtDefault(stmt: Statement): string {
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
                res = `$${this.name_(stmt.name)} = null;`;
            else if (stmt.initializer !== null)
                res = `$${this.name_(stmt.name)} = ${this.mutateArg(stmt.initializer, stmt.mutability.mutated)};`;
            else
                res = `/* @var $${this.name_(stmt.name)} */`;
        } else if (stmt instanceof ForeachStatement) {
            res = `foreach (${this.expr(stmt.items)} as $${this.name_(stmt.itemVar.name)})` + this.block(stmt.body);
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
//                this.usings.add("System");
                res += ` catch (Exception $${this.name_(stmt.catchVar.name)})${this.block(stmt.catchBody, false)}`;
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

        if (stmt.attributes !== null && "php" in stmt.attributes) {
            res = stmt.attributes["php"];
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

    classLike(cls: IInterface) {
        this.currentClass = cls;
        const resList: string[] = [];

        const staticConstructorStmts: Statement[] = [];
        const complexFieldInits: Statement[] = [];
        if (cls instanceof Class) {
            const fieldReprs: string[] = [];
            for (const field of cls.fields) {
                const isInitializerComplex = field.initializer !== null && 
                    !(field.initializer instanceof StringLiteral) && 
                    !(field.initializer instanceof BooleanLiteral) && 
                    !(field.initializer instanceof NumericLiteral);

                const prefix = `${this.vis(field.visibility, true)}${this.preIf("static ", field.isStatic)}`;
                if (isInitializerComplex) {
                    if (field.isStatic)
                        staticConstructorStmts.push(new ExpressionStatement(new BinaryExpression(new StaticFieldReference(field), "=", field.initializer)));
                    else
                        complexFieldInits.push(new ExpressionStatement(new BinaryExpression(new InstanceFieldReference(new ThisReference(cls), field), "=", field.initializer)));
                    
                    fieldReprs.push(`${prefix}${this.varWoInit(field, field)};`);
                } else
                    fieldReprs.push(`${prefix}${this.var(field, field)};`);
            }
            resList.push(fieldReprs.join("\n"));

            for (const prop of cls.properties) {
                if (prop.getter !== null)
                    resList.push(
                        this.vis(prop.visibility, false) + 
                        this.preIf("static ", prop.isStatic) +
                        `function get_${this.name_(prop.name)}()${this.block(prop.getter, false)}`);
                if (prop.setter !== null)
                    resList.push(
                        this.vis(prop.visibility, false) + 
                        this.preIf("static ", prop.isStatic) +
                        `function set_${this.name_(prop.name)}($value)${this.block(prop.setter, false)}`);
            }

            if (staticConstructorStmts.length > 0)
                resList.push(`static function StaticInit()\n{\n${this.pad(this.stmts(staticConstructorStmts))}\n}`);

            if (cls.constructor_ !== null) {
                const constrFieldInits: Statement[] = [];
                for (const field of cls.fields.filter(x => x.constructorParam !== null)) {
                    const fieldRef = new InstanceFieldReference(new ThisReference(cls), field);
                    const mpRef = new MethodParameterReference(field.constructorParam);
                    // TODO: decide what to do with "after-TypeEngine" transformations
                    mpRef.setActualType(field.type, false, false);
                    constrFieldInits.push(new ExpressionStatement(new BinaryExpression(fieldRef, "=", mpRef)));
                }

                const parentCall = cls.constructor_.superCallArgs !== null ? `parent::__construct(${cls.constructor_.superCallArgs.map(x => this.expr(x)).join(", ")});\n` : "";

                resList.push(
                    this.preIf("/* throws */ ", cls.constructor_.throws) + 
                    "function __construct" +
                    `(${cls.constructor_.parameters.map(p => this.var(p, p)).join(", ")})` +
                    ` {\n${this.pad(
                        parentCall +
                        this.stmts(constrFieldInits.concat(complexFieldInits).concat(cls.constructor_.body.statements)))}\n}`);
            } else if (complexFieldInits.length > 0)
                resList.push(`function __construct()\n{\n${this.pad(this.stmts(complexFieldInits))}\n}`);

        } else if (cls instanceof Interface) {
            //resList.push(cls.fields.map(field => `${this.varWoInit(field, field)} { get; set; }`).join("\n"));
        }

        const methods: string[] = [];
        for (const method of cls.methods) {
            if (cls instanceof Class && method.body === null) continue; // declaration only
            methods.push(
                (method.parentInterface instanceof Interface ? "" : this.vis(method.visibility, false)) +
                this.preIf("static ", method.isStatic) +
                //this.preIf("virtual ", method.overrides === null && method.overriddenBy.length > 0) + 
                //this.preIf("override ", method.overrides !== null) +
                //this.preIf("async ", method.async) +
                this.preIf("/* throws */ ", method.throws) +
                `function ` +
                this.name_(method.name) + this.typeArgs(method.typeArguments) + 
                `(${method.parameters.map(p => this.var(p, null)).join(", ")})` +
                (method.body !== null ? ` {\n${this.pad(this.stmts(method.body.statements))}\n}` : ";"));
        }
        resList.push(methods.join("\n\n"));

        const resListJoined = this.pad(resList.filter(x => x !== "").join("\n\n"));
        return ` {\n${resListJoined}\n}` +
            (staticConstructorStmts.length > 0 ? `\n${this.name_(cls.name)}::StaticInit();` : "");
    }

    pad(str: string): string { return str.split(/\n/g).map(x => `    ${x}`).join('\n'); }

    pathToNs(path: string): string {
        // Generator/ExprLang/ExprLangAst -> Generator\ExprLang\ExprLangAst
        const parts = path.split(/\//g);
        //parts.pop();
        return parts.join('\\');
    }

    enumName(enum_: Enum, isDecl = false) {
        return enum_.name;
    }

    enumMemberName(name: string): string {
        return this.name_(name).toUpperCase();
    }

    genFile(projName: string, sourceFile: SourceFile): string {
        this.usings = new Set<string>();

        const enums: string[] = [];
        for (const enum_ of sourceFile.enums) {
            const values: string[] = [];
            for (let i = 0; i < enum_.values.length; i++)
                values.push(`const ${this.enumMemberName(enum_.values[i].name)} = ${i + 1};`);
            enums.push(`class ${this.enumName(enum_, true)} {\n` + this.pad(values.join("\n")) + `\n}`);
        }

        const intfs = sourceFile.interfaces.map(intf => `interface ${this.name_(intf.name)}${this.typeArgs(intf.typeArguments)}`+
            `${this.preArr(" extends ", intf.baseInterfaces.map(x => this.type(x)))}${this.classLike(intf)}`);

        const classes: string[] = [];
        for (const cls of sourceFile.classes) {
            classes.push(
                `class ` + this.name_(cls.name) + 
                (cls.baseClass !== null ? " extends " + this.type(cls.baseClass) : "") + 
                this.preArr(" implements ", cls.baseInterfaces.map(x => this.type(x))) + 
                `${this.classLike(cls)}`);
        }

        const main = this.rawBlock(sourceFile.mainBlock);

        const usingsSet = new Set<string>();
        for (const imp of sourceFile.imports) {
            if ("php-use" in imp.attributes)
                for (const item of imp.attributes["php-use"].split(/\n/g))
                    usingsSet.add(item);
            else {
                const fileNs = this.pathToNs(imp.exportScope.scopeName);
                if (fileNs === "index") continue;
                for (const impItem of imp.imports)
                    usingsSet.add(`${imp.exportScope.packageName}\\${fileNs}\\${this.name_(impItem.name)}`);
            }
        }

        for (const using of this.usings.values())
            usingsSet.add(using);

        const usings: string[] = [];
        for (const using of usingsSet.values())
            usings.push(`use ${using};`);

        let result = [usings.join("\n"), enums.join("\n"), intfs.join("\n\n"), classes.join("\n\n"), main].filter(x => x !== "").join("\n\n");
        result = `<?php\n\nnamespace ${projName}\\${this.pathToNs(sourceFile.sourcePath.path)};\n\n${result}\n`;
        return result;
    }

    generate(pkg: Package): GeneratedFile[] {
        const result: GeneratedFile[] = [];
        for (const path of Object.keys(pkg.files))
            result.push(new GeneratedFile(`${pkg.name}/${path}.php`, this.genFile(pkg.name, pkg.files[path])));
        return result;
    }
}