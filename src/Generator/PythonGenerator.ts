import { NewExpression, Identifier, TemplateString, ArrayLiteral, CastExpression, BooleanLiteral, StringLiteral, NumericLiteral, CharacterLiteral, PropertyAccessExpression, Expression, ElementAccessExpression, BinaryExpression, UnresolvedCallExpression, ConditionalExpression, InstanceOfExpression, ParenthesizedExpression, RegexLiteral, UnaryExpression, UnaryType, MapLiteral, NullLiteral, AwaitExpression, UnresolvedNewExpression, UnresolvedMethodCallExpression, InstanceMethodCallExpression, NullCoalesceExpression, GlobalFunctionCallExpression, StaticMethodCallExpression, LambdaCallExpression, IMethodCallExpression } from "../One/Ast/Expressions";
import { Statement, ReturnStatement, UnsetStatement, ThrowStatement, ExpressionStatement, VariableDeclaration, BreakStatement, ForeachStatement, IfStatement, WhileStatement, ForStatement, DoStatement, ContinueStatement, ForVariable, TryStatement, Block } from "../One/Ast/Statements";
import { Class, IClassMember, SourceFile, IMethodBase, Constructor, IVariable, Lambda, IImportable, UnresolvedImport, Interface, Enum, IInterface, Field, Property, MethodParameter, IVariableWithInitializer, Visibility, IAstNode, GlobalFunction, Package, SourcePath, IHasAttributesAndTrivia, ExportedScope, ExportScopeRef } from "../One/Ast/Types";
import { VoidType, ClassType, InterfaceType, EnumType, AnyType, LambdaType, NullType, GenericsType } from "../One/Ast/AstTypes";
import { ThisReference, EnumReference, ClassReference, MethodParameterReference, VariableDeclarationReference, ForVariableReference, ForeachVariableReference, SuperReference, StaticFieldReference, StaticPropertyReference, InstanceFieldReference, InstancePropertyReference, EnumMemberReference, CatchVariableReference, GlobalFunctionReference, StaticThisReference, Reference, VariableReference } from "../One/Ast/References";
import { GeneratedFile } from "./GeneratedFile";
import { TSOverviewGenerator } from "../Utils/TSOverviewGenerator";
import { IGeneratorPlugin } from "./IGeneratorPlugin";
import { JsToPython } from "./PythonPlugins/JsToPython";
import { NameUtils } from "./NameUtils";
import { IExpression, IType } from "../One/Ast/Interfaces";
import { IGenerator } from "./IGenerator";
import { ITransformer } from "../One/ITransformer";

export class PythonGenerator implements IGenerator {
    tmplStrLevel = 0;
    package: Package;
    currentFile: SourceFile;
    imports: Set<string>;
    importAllScopes: Set<string>;
    currentClass: IInterface;
    reservedWords: string[] = ["from", "async", "global", "lambda", "cls", "import", "pass"];
    fieldToMethodHack: string[] = [];
    plugins: IGeneratorPlugin[] = [];

    constructor() {
        this.plugins.push(new JsToPython(this));
    }

    getLangName(): string { return "Python"; }
    getExtension(): string { return "py"; }
    getTransforms(): ITransformer[] { return []; }
    
    type(type: IType) {
        if (type instanceof ClassType) {
            if (type.decl.name === "TsString")       return "str";
            else if (type.decl.name === "TsBoolean") return "bool";
            else if (type.decl.name === "TsNumber")  return "int";
            else
                return this.clsName(type.decl);
        } else {
            debugger;
            return "NOT-HANDLED-TYPE";
        }
    }

    splitName(name: string): string[] {
        const nameParts: string[] = [];
        let partStartIdx = 0;
        for (let i = 1; i < name.length; i++) {
            const prevChrCode = name.charCodeAt(i - 1);
            const chrCode = name.charCodeAt(i);
            if (65 <= chrCode && chrCode <= 90 && !(65 <= prevChrCode && prevChrCode <= 90)) { // 'A' .. 'Z'
                nameParts.push(name.substring(partStartIdx, i).toLowerCase());
                partStartIdx = i;
            } else if (chrCode === 95) { // '-'
                nameParts.push(name.substring(partStartIdx, i));
                partStartIdx = i + 1;
            }
        }
        nameParts.push(name.substr(partStartIdx).toLowerCase());
        return nameParts;
    }

    name_(name: string) {
        if (this.reservedWords.includes(name)) name += "_";
        if (this.fieldToMethodHack.includes(name)) name += "()";
        return this.splitName(name).join("_");
    }

    calcImportedName(exportScope: ExportScopeRef, name: string): string {
        if (this.importAllScopes.has(exportScope.getId()))
            return name;
        else
            return this.calcImportAlias(exportScope) + "." + name;
    }

    enumName(enum_: Enum, isDecl = false) {
        let name = this.name_(enum_.name).toUpperCase();
        if (isDecl || enum_.parentFile.exportScope === null || enum_.parentFile === this.currentFile)
            return name;
        return this.calcImportedName(enum_.parentFile.exportScope, name);
    }

    enumMemberName(name: string) {
        return this.name_(name).toUpperCase();
    }

    clsName(cls: IInterface, isDecl = false): string {
        // TODO: hack
        if (cls.name === "Set") return "dict";
        if (isDecl || cls.parentFile.exportScope === null || cls.parentFile === this.currentFile) return cls.name;
        return this.calcImportedName(cls.parentFile.exportScope, cls.name);
    }

    leading(item: Statement) {
        let result = "";
        if (item.leadingTrivia !== null && item.leadingTrivia.length > 0)
            result += item.leadingTrivia.replace(/\/\//g, "#");
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

    isTsArray(type: IType) { return type instanceof ClassType && type.decl.name == "TsArray"; }

    vis(v: Visibility) {
        return v === Visibility.Private ? "__" :
               v === Visibility.Protected ? "_" :
               v === Visibility.Public ? "" :
               "/* TODO: not set */public";
    }

    varWoInit(v: IVariable, attr: IHasAttributesAndTrivia) {
        return this.name_(v.name);
    }

    var(v: IVariableWithInitializer, attrs: IHasAttributesAndTrivia) {
        return `${this.varWoInit(v, attrs)}${v.initializer !== null ? ` = ${this.expr(v.initializer)}` : ""}`;
    }

    exprCall(args: Expression[]) {
        return `(${args.map(x => this.expr(x)).join(", ")})`;
    }

    callParams(args: Expression[]) {
        const argReprs: string[] = [];
        for (let i = 0; i < args.length; i++)
            argReprs.push(this.expr(args[i]));
        return `(${argReprs.join(", ")})`;
    }

    methodCall(expr: IMethodCallExpression) {
        return this.name_(expr.method.name) + this.callParams(expr.args);
    }

    expr(expr: IExpression): string {
        for (const plugin of this.plugins) {
            const result = plugin.expr(expr);
            if (result !== null)
                return result;
        }

        let res = "UNKNOWN-EXPR";
        if (expr instanceof NewExpression) {
            // TODO: hack
            if (expr.cls.decl.name === "Set")
                res = expr.args.length === 0 ? "dict()" : `dict.fromkeys${this.callParams(expr.args)}`;
            else
                res = `${this.clsName(expr.cls.decl)}${this.callParams(expr.args)}`;
        } else if (expr instanceof UnresolvedNewExpression) {
            res = `/* TODO: UnresolvedNewExpression */ ${expr.cls.typeName}(${expr.args.map(x => this.expr(x)).join(", ")})`;
        } else if (expr instanceof Identifier) {
            res = `/* TODO: Identifier */ ${expr.text}`;
        } else if (expr instanceof PropertyAccessExpression) {
            res = `/* TODO: PropertyAccessExpression */ ${this.expr(expr.object)}.${expr.propertyName}`;
        } else if (expr instanceof UnresolvedCallExpression) {
            res = `/* TODO: UnresolvedCallExpression */ ${this.expr(expr.func)}${this.exprCall(expr.args)}`;
        } else if (expr instanceof UnresolvedMethodCallExpression) {
            res = `/* TODO: UnresolvedMethodCallExpression */ ${this.expr(expr.object)}.${expr.methodName}${this.exprCall(expr.args)}`;
        } else if (expr instanceof InstanceMethodCallExpression) {
            res = `${this.expr(expr.object)}.${this.methodCall(expr)}`;
        } else if (expr instanceof StaticMethodCallExpression) {
            //const parent = expr.method.parentInterface === this.currentClass ? "cls" : this.clsName(expr.method.parentInterface);
            const parent = this.clsName(expr.method.parentInterface);
            res = `${parent}.${this.methodCall(expr)}`;
        } else if (expr instanceof GlobalFunctionCallExpression) {
            this.imports.add("from OneLangStdLib import *");
            res = `${this.name_(expr.func.name)}${this.exprCall(expr.args)}`;
        } else if (expr instanceof LambdaCallExpression) {
            res = `${this.expr(expr.method)}(${expr.args.map(x => this.expr(x)).join(", ")})`;
        } else if (expr instanceof BooleanLiteral) {
            res = `${expr.boolValue ? "True" : "False"}`;
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
                if (part.isLiteral) {
                    let lit = "";
                    for (let i = 0; i < part.literalText.length; i++) {
                        const chr = part.literalText[i];
                        if (chr === '\n')      lit += "\\n";
                        else if (chr === '\r') lit += "\\r";
                        else if (chr === '\t') lit += "\\t";
                        else if (chr === '\\') lit += "\\\\";
                        else if (chr === '\'')  lit += "\\'";
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
                    this.tmplStrLevel++;
                    const repr = this.expr(part.expression);
                    this.tmplStrLevel--;
                    parts.push(part.expression instanceof ConditionalExpression ? `{(${repr})}` : `{${repr}}`);
                }
            }
            res = this.tmplStrLevel === 1 ? `f'${parts.join('')}'` : `f'''${parts.join('')}'''`;
        } else if (expr instanceof BinaryExpression) {
            const op = expr.operator === "&&" ? "and" : expr.operator === "||" ? "or" : expr.operator;
            res = `${this.expr(expr.left)} ${op} ${this.expr(expr.right)}`;
        } else if (expr instanceof ArrayLiteral) {
            res = `[${expr.items.map(x => this.expr(x)).join(', ')}]`;
        } else if (expr instanceof CastExpression) {
            res = `${this.expr(expr.expression)}`;
        } else if (expr instanceof ConditionalExpression) {
            res = `${this.expr(expr.whenTrue)} if ${this.expr(expr.condition)} else ${this.expr(expr.whenFalse)}`;
        } else if (expr instanceof InstanceOfExpression) {
            res = `isinstance(${this.expr(expr.expr)}, ${this.type(expr.checkType)})`;
        } else if (expr instanceof ParenthesizedExpression) {
            res = `(${this.expr(expr.expression)})`;
        } else if (expr instanceof RegexLiteral) {
            res = `RegExp(${JSON.stringify(expr.pattern)})`;
        } else if (expr instanceof Lambda) {
            let body: string = "INVALID-BODY";
            if (expr.body.statements.length === 1 && expr.body.statements[0] instanceof ReturnStatement)
                body = this.expr((<ReturnStatement>expr.body.statements[0]).expression);
            else {
                console.error(`Multi-line lambda is not yet supported for Python: ${TSOverviewGenerator.preview.nodeRepr(expr)}`);
                debugger;
            }

            const params = expr.parameters.map(x => this.name_(x.name));

            res = `lambda ${params.join(", ")}: ${body}`;
        } else if (expr instanceof UnaryExpression && expr.unaryType === UnaryType.Prefix) {
            const op = expr.operator === "!" ? "not " : expr.operator;
            if (op === "++")
                res = `${this.expr(expr.operand)} = ${this.expr(expr.operand)} + 1`;
            else if (op === "--")
                res = `${this.expr(expr.operand)} = ${this.expr(expr.operand)} - 1`;
            else
                res = `${op}${this.expr(expr.operand)}`;
        } else if (expr instanceof UnaryExpression && expr.unaryType === UnaryType.Postfix) {
            if (expr.operator === "++")
                res = `${this.expr(expr.operand)} = ${this.expr(expr.operand)} + 1`;
            else if (expr.operator === "--")
                res = `${this.expr(expr.operand)} = ${this.expr(expr.operand)} - 1`;
            else
                res = `${this.expr(expr.operand)}${expr.operator}`;
        } else if (expr instanceof MapLiteral) {
            const repr = expr.items.map(item => `${JSON.stringify(item.key)}: ${this.expr(item.value)}`).join(",\n");
            res = expr.items.length === 0 ? "{}" : `{\n${this.pad(repr)}\n}`;
        } else if (expr instanceof NullLiteral) {
            res = `None`;
        } else if (expr instanceof AwaitExpression) {
            res = `${this.expr(expr.expr)}`;
        } else if (expr instanceof ThisReference) {
            res = `self`;
        } else if (expr instanceof StaticThisReference) {
            res = `cls`;
        } else if (expr instanceof EnumReference) {
            res = `${this.enumName(expr.decl)}`;
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
            res = `super()`;
        } else if (expr instanceof StaticFieldReference) {
            res = `${this.clsName(expr.decl.parentInterface)}.${this.name_(expr.decl.name)}`;
        } else if (expr instanceof StaticPropertyReference) {
            res = `${this.clsName(expr.decl.parentClass)}.get_${this.name_(expr.decl.name)}()`;
        } else if (expr instanceof InstanceFieldReference) {
            res = `${this.expr(expr.object)}.${this.name_(expr.field.name)}`;
        } else if (expr instanceof InstancePropertyReference) {
            res = `${this.expr(expr.object)}.get_${this.name_(expr.property.name)}()`;
        } else if (expr instanceof EnumMemberReference) {
            res = `${this.enumName(expr.decl.parentEnum)}.${this.enumMemberName(expr.decl.name)}`;
        } else if (expr instanceof NullCoalesceExpression) {
            res = `${this.expr(expr.defaultExpr)} or ${this.expr(expr.exprIfNull)}`;
        } else debugger;
        return res;
    }

    stmtDefault(stmt: Statement): string {
        const nl = "\n";
        if (stmt instanceof BreakStatement) {
            return "break";
        } else if (stmt instanceof ReturnStatement) {
            return stmt.expression === null ? "return" : `return ${this.expr(stmt.expression)}`;
        } else if (stmt instanceof UnsetStatement) {
            return `/* unset ${this.expr(stmt.expression)}; */`;
        } else if (stmt instanceof ThrowStatement) {
            return `raise ${this.expr(stmt.expression)}`;
        } else if (stmt instanceof ExpressionStatement) {
            return `${this.expr(stmt.expression)}`;
        } else if (stmt instanceof VariableDeclaration) {
            return stmt.initializer !== null ? `${this.name_(stmt.name)} = ${this.expr(stmt.initializer)}` : "";
        } else if (stmt instanceof ForeachStatement) {
            return `for ${this.name_(stmt.itemVar.name)} in ${this.expr(stmt.items)}:\n${this.block(stmt.body)}`;
        } else if (stmt instanceof IfStatement) {
            const elseIf = stmt.else_ !== null && stmt.else_.statements.length === 1 && stmt.else_.statements[0] instanceof IfStatement;
            return `if ${this.expr(stmt.condition)}:\n${this.block(stmt.then)}` +
                (elseIf ? `\nel${this.stmt(stmt.else_.statements[0])}` : "") +
                (!elseIf && stmt.else_ !== null ? `\nelse:\n${this.block(stmt.else_)}` : "");
        } else if (stmt instanceof WhileStatement) {
            return `while ${this.expr(stmt.condition)}:\n${this.block(stmt.body)}`;
        } else if (stmt instanceof ForStatement) {
            return (stmt.itemVar !== null ? `${this.var(stmt.itemVar, null)}\n` : "") + 
                `\nwhile ${this.expr(stmt.condition)}:\n${this.block(stmt.body)}\n${this.pad(this.expr(stmt.incrementor))}`;
        } else if (stmt instanceof DoStatement) {
            return `while True:\n${this.block(stmt.body)}\n${this.pad(`if not (${this.expr(stmt.condition)}):${nl}${this.pad("break")}`)}`;
        } else if (stmt instanceof TryStatement) {
            return `try:\n${this.block(stmt.tryBody)}` +
                (stmt.catchBody !== null ? `\nexcept Exception as ${this.name_(stmt.catchVar.name)}:\n${this.block(stmt.catchBody)}` : "") +
                (stmt.finallyBody !== null ? `\nfinally:\n${this.block(stmt.finallyBody)}` : "");
        } else if (stmt instanceof ContinueStatement) {
            return `continue`;
        } else {
            debugger;
            return "UNKNOWN-STATEMENT";
        }
    }

    stmt(stmt: Statement): string {
        let res: string = null;

        if (stmt.attributes !== null && "python" in stmt.attributes) {
            res = stmt.attributes["python"];
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

    stmts(stmts: Statement[], skipPass = false): string { return this.pad(stmts.length === 0 && !skipPass ? "pass" : stmts.map(stmt => this.stmt(stmt)).join("\n")); }
    block(block: Block, skipPass = false): string { return this.stmts(block.statements, skipPass); }
    pass(str: string) { return str === "" ? "pass" : str; }

    cls(cls: Class) {
        if (cls.attributes["external"] === "true") return "";
        this.currentClass = cls;
        const resList: string[] = [];
        const classAttributes: string[] = [];

        const staticFields = cls.fields.filter(x => x.isStatic);

        if (staticFields.length > 0) {
            this.imports.add("import OneLangStdLib as one");
            classAttributes.push("@one.static_init");
            const fieldInits = staticFields.map(f => `cls.${this.vis(f.visibility)}${this.var(f, f).replace(cls.name, "cls")}`);
            resList.push(`@classmethod\ndef static_init(cls):\n` + this.pad(fieldInits.join("\n")));
        }

        const constrStmts: string[] = [];

        for (const field of cls.fields.filter(x => !x.isStatic)) {
            const init = field.constructorParam !== null ? this.name_(field.constructorParam.name) : 
                field.initializer !== null ? this.expr(field.initializer) : "None";
            constrStmts.push(`self.${this.name_(field.name)} = ${init}`);
        }

        if (cls.baseClass !== null) {
            if (cls.constructor_ !== null && cls.constructor_.superCallArgs !== null)
                constrStmts.push(`super().__init__(${cls.constructor_.superCallArgs.map(x => this.expr(x)).join(", ")})`);
            else
                constrStmts.push(`super().__init__()`);
        }

        if (cls.constructor_ !== null)
            for (const stmt of cls.constructor_.body.statements)
                constrStmts.push(this.stmt(stmt));

        resList.push(
            `def __init__(self${cls.constructor_ === null ? "" : cls.constructor_.parameters.map(p => `, ${this.var(p, null)}`).join('')}):\n` +
            this.pad(this.pass(constrStmts.join("\n"))));

        for (const prop of cls.properties) {
            if (prop.getter !== null)
                resList.push(`def get_${this.name_(prop.name)}(self):\n${this.block(prop.getter)}`);
        }

        const methods: string[] = [];
        for (const method of cls.methods) {
            if (method.body === null) continue; // declaration only
            methods.push(
                (method.isStatic ? "@classmethod\n" : "") +
                `def ${this.name_(method.name)}` +
                `(${method.isStatic ? "cls" : "self"}${method.parameters.map(p => `, ${this.var(p, null)}`).join("")}):` +
                "\n" +
                this.block(method.body));
        }
        resList.push(methods.join("\n\n"));
        const resList2 = resList.filter(x => x !== "");

        const clsHdr = `class ${this.clsName(cls, true)}${cls.baseClass !== null ? `(${this.clsName((<ClassType>cls.baseClass).decl)})` : ""}:\n`;
        return classAttributes.map(x => `${x}\n`).join("") + clsHdr + this.pad(resList2.length > 0 ? resList2.join("\n\n") : "pass");
    }

    pad(str: string): string { return str === "" ? "" : str.split(/\n/g).map(x => `    ${x}`).join('\n'); }

    calcRelImport(targetPath: ExportScopeRef, fromPath: ExportScopeRef) {
        const targetParts = targetPath.scopeName.split(/\//g);
        const fromParts = fromPath.scopeName.split(/\//g);

        let sameLevel = 0;
        while (sameLevel < targetParts.length && sameLevel < fromParts.length && targetParts[sameLevel] === fromParts[sameLevel])
            sameLevel++;
        
        let result = "";
        for (let i = 1; i < fromParts.length - sameLevel; i++)
            result += ".";
        
        for (let i = sameLevel; i < targetParts.length; i++)
            result += "." + targetParts[i];

        return result;
    }

    calcImportAlias(targetPath: ExportScopeRef): string {
        const parts = targetPath.scopeName.split(/\//g);
        const filename = parts[parts.length - 1];
        return NameUtils.shortName(filename);
    }

    genFile(sourceFile: SourceFile): string {
        this.currentFile = sourceFile;
        this.imports = new Set<string>();
        this.importAllScopes = new Set<string>();
        this.imports.add("from OneLangStdLib import *"); // TODO: do not add this globally, just for nativeResolver methods
        
        if (sourceFile.enums.length > 0)
            this.imports.add("from enum import Enum");

        for (const import_ of sourceFile.imports.filter(x => !x.importAll)) {
            if (import_.attributes["python-ignore"] === "true")
                continue;

            if ("python-import-all" in import_.attributes) {
                this.imports.add(`from ${import_.attributes["python-import-all"]} import *`);
                this.importAllScopes.add(import_.exportScope.getId());
            } else {
                const alias = this.calcImportAlias(import_.exportScope);
                this.imports.add(`import ${this.package.name}.${import_.exportScope.scopeName.replace(/\//g, ".")} as ${alias}`);
            }
        }

        const enums: string[] = [];
        for (const enum_ of sourceFile.enums) {
            const values: string[] = [];
            for (let i = 0; i < enum_.values.length; i++)
                values.push(`${this.enumMemberName(enum_.values[i].name)} = ${i + 1}`);
            enums.push(`class ${this.enumName(enum_, true)}(Enum):\n` + this.pad(values.join("\n")));
        }

        const classes: string[] = [];
        for (const cls of sourceFile.classes)
            classes.push(this.cls(cls));

        const main = sourceFile.mainBlock.statements.length > 0 ? this.block(sourceFile.mainBlock) : "";

        const imports: string[] = [];
        for (const imp of this.imports)
            imports.push(imp);

        return [imports.join("\n"), enums.join("\n\n"), classes.join("\n\n"), main].filter(x => x !== "").join("\n\n");
    }

    generate(pkg: Package): GeneratedFile[] {
        this.package = pkg;
        const result: GeneratedFile[] = [];
        for (const path of Object.keys(pkg.files))
            result.push(new GeneratedFile(`${pkg.name}/${path}.py`, this.genFile(pkg.files[path])));
        return result;
    }
}