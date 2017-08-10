import * as ts from "typescript";
import fs = require("fs");
import { KSLangSchema as ks } from "./KSLangSchema";
import * as SimpleAst from "ts-simple-ast";

function logNodeError(message: string, node?: Node) {
    console.warn(message, node);
}

function nameToKS(name: string, node?: Node) {
    let result = "";
    for (let c of name) {
        if ("A" <= c && c <= "Z")
            result += (result === "" ? "" : "_") + c.toLowerCase();
        else if("a" <= c && c <= "z" || c === "_")
            result += c;
        else
            logNodeError(`Invalid character ('${c}') in name: ${name}.`, node);
    }
    return result;
}

const ast = new SimpleAst.default();
ast.addSourceFiles("input/Tokenizer.ts");
const sourceFile = ast.getSourceFiles()[0];

function convertTsType(tsType: ts.Type) {
    const result = <ks.Type> { };

    const typeText = (<any>tsType).intrinsicName || tsType.symbol.name;
    if (typeText === "number")
        result.type = ks.PrimitiveType.Int32;
    else if (typeText === "string")
        result.type = ks.PrimitiveType.String;
    else if (typeText === "boolean")
        result.type = ks.PrimitiveType.Boolean;
    else if (typeText === "void")
        result.type = ks.PrimitiveType.Void;
    else {
        const isArray = typeText === "Array";
        result.type = isArray ? ks.PrimitiveType.Array : 
            ks.PrimitiveType.Class;
        
        if(!isArray)
            result.className = nameToKS(typeText);

        const typeArgs = <ts.Type[]>(<any>tsType).typeArguments;
        if (typeArgs)
            result.typeArguments = typeArgs.map(x => convertTsType(x));
    }

    return result;
}

function convertParameter(tsParam: SimpleAst.ParameterDeclaration) {
    return <ks.MethodParameter> {
        name: nameToKS(tsParam.getName()),
        type: convertTsType(tsParam.getType().compilerType)
    };
}

function convertExpression(tsExpr: ts.Expression): ks.Expression {
    if (typeof tsExpr === "undefined") return undefined;

    if (tsExpr.kind === ts.SyntaxKind.CallExpression) {
        const callExpr = <ts.CallExpression> tsExpr;
        return <ks.CallExpression> {
            type: ks.ExpressionType.Call,
            method: convertExpression(callExpr.expression),
            arguments: callExpr.arguments.map(arg => convertExpression(arg))
        };
    } else if (tsExpr.kind === ts.SyntaxKind.BinaryExpression) {
        const binaryExpr = <ts.BinaryExpression> tsExpr;
        return <ks.BinaryExpression> {
            type: ks.ExpressionType.Binary,
            left: convertExpression(binaryExpr.left),
            right: convertExpression(binaryExpr.right),
            operator: binaryExpr.operatorToken.getText()
        };
    } else if (tsExpr.kind === ts.SyntaxKind.PropertyAccessExpression) {
        const propAccessExpr = <ts.PropertyAccessExpression> tsExpr;
        return <ks.PropertyAccessExpression> {
            type: ks.ExpressionType.PropertyAccess,
            object: convertExpression(propAccessExpr.expression),
            propertyName: convertExpression(propAccessExpr.name)
        };
    } else if (tsExpr.kind === ts.SyntaxKind.ElementAccessExpression) {
        const elementAccessExpr = <ts.ElementAccessExpression> tsExpr;
        return <ks.PropertyAccessExpression> {
            type: ks.ExpressionType.PropertyAccess,
            object: convertExpression(elementAccessExpr.expression),
            propertyName: convertExpression(elementAccessExpr.argumentExpression)
        };
    } else if (tsExpr.kind === ts.SyntaxKind.Identifier) {
        const identifier = <ts.Identifier> tsExpr;
        return <ks.Identifier> { 
            type: ks.ExpressionType.Identifier,
            text: identifier.text
        };
    } else if (tsExpr.kind === ts.SyntaxKind.NewExpression) {
        const newExpr = <ts.NewExpression> tsExpr;
        return <ks.NewExpression> { 
            type: ks.ExpressionType.New,
            class: convertExpression(newExpr.expression),
            arguments: newExpr.arguments.map(arg => convertExpression(arg))
        };
    } else if (tsExpr.kind === ts.SyntaxKind.ConditionalExpression) {
        const condExpr = <ts.ConditionalExpression> tsExpr;
        return <ks.ConditionalExpression> { 
            type: ks.ExpressionType.Conditional,
            condition: convertExpression(condExpr.condition),
            whenTrue: convertExpression(condExpr.whenTrue),
            whenFalse: convertExpression(condExpr.whenFalse),
        };
    } else if (tsExpr.kind === ts.SyntaxKind.StringLiteral) {
        const stringLiteralExpr = <ts.StringLiteral> tsExpr;
        return <ks.StringLiteral> { 
            type: ks.ExpressionType.StringLiteral,
            value: stringLiteralExpr.text
        };
    } else if (tsExpr.kind === ts.SyntaxKind.ParenthesizedExpression) {
        const parenExpr = <ts.ParenthesizedExpression> tsExpr;
        return <ks.ParenthesizedExpression> { 
            type: ks.ExpressionType.Parenthesized,
            expression: convertExpression(parenExpr.expression)
        };
    } else if (tsExpr.kind === ts.SyntaxKind.PostfixUnaryExpression) {
        const postfixUnaryExpr = <ts.PostfixUnaryExpression> tsExpr;
        return <ks.PostfixUnaryExpression> { 
            type: ks.ExpressionType.PostfixUnary,
            operator: 
                postfixUnaryExpr.operator === ts.SyntaxKind.PlusPlusToken ? "++" : 
                postfixUnaryExpr.operator === ts.SyntaxKind.MinusMinusToken ? "--" : null,
            operand: convertExpression(postfixUnaryExpr.operand)
        };
    } else if (tsExpr.kind === ts.SyntaxKind.PrefixUnaryExpression) {
        const prefixUnaryExpr = <ts.PrefixUnaryExpression> tsExpr;
        return <ks.PrefixUnaryExpression> { 
            type: ks.ExpressionType.PrefixUnary,
            operator: 
                prefixUnaryExpr.operator === ts.SyntaxKind.PlusPlusToken ? "++" : 
                prefixUnaryExpr.operator === ts.SyntaxKind.MinusMinusToken ? "--" : 
                prefixUnaryExpr.operator === ts.SyntaxKind.PlusToken ? "+" : 
                prefixUnaryExpr.operator === ts.SyntaxKind.MinusToken ? "-" : 
                prefixUnaryExpr.operator === ts.SyntaxKind.TildeToken ? "~" : 
                prefixUnaryExpr.operator === ts.SyntaxKind.ExclamationToken ? "!" : null,
            operand: convertExpression(prefixUnaryExpr.operand)
        };
    } else {
        const kindName = ts.SyntaxKind[tsExpr.kind];
        const knownKeywords = ["this", "super", "true", "false"];
        const keyword = knownKeywords.find(x => kindName.toLowerCase() === `${x}keyword`);
        if (keyword) {
            return <ks.Identifier> {
                type: ks.ExpressionType.Identifier,
                text: keyword
            };
        } else {
            logNodeError(`Unexpected expression kind "${ts.SyntaxKind[tsExpr.kind]}".`); 
            return null;
        }
    }
}

function convertStatement(tsStatement: ts.Statement): ks.Statement[] {
    if (typeof tsStatement === "undefined") return undefined;

    let ksStmt: ks.Statement = null;
    let ksStmts: ks.Statement[] = null;

    if (tsStatement.kind === ts.SyntaxKind.IfStatement) {
        const ifStatement = <ts.IfStatement> tsStatement;
        ksStmt = <ks.IfStatement> {
            type: ks.StatementType.If,
            condition: convertExpression(ifStatement.expression),
            then: convertBlock(ifStatement.thenStatement),
            else: convertBlock(ifStatement.elseStatement),
        };
    } else if (tsStatement.kind === ts.SyntaxKind.ReturnStatement) {
        const returnStatement = <ts.ReturnStatement> tsStatement;
        ksStmt = <ks.ReturnStatement> {
            type: ks.StatementType.Return,
            expression: convertExpression(returnStatement.expression),
        };
    } else if (tsStatement.kind === ts.SyntaxKind.ThrowStatement) {
        const throwStatement = <ts.ReturnStatement> tsStatement;
        ksStmt = <ks.ThrowStatement> {
            type: ks.StatementType.Throw,
            expression: convertExpression(throwStatement.expression),
        };
    } else if (tsStatement.kind === ts.SyntaxKind.ExpressionStatement) {
        const expressionStatement = <ts.ExpressionStatement> tsStatement;
        ksStmt = <ks.ExpressionStatement> {
            type: ks.StatementType.Expression,
            expression: convertExpression(expressionStatement.expression),
        };
    } else if (tsStatement.kind === ts.SyntaxKind.VariableStatement) {
        const variableStatement = <ts.VariableStatement> tsStatement;
        ksStmts = variableStatement.declarationList.declarations.map(varDecl => {
            return <ks.VariableStatement> {
                type: ks.StatementType.Variable,
                variableName: varDecl.name.getText(),
                initializer: convertExpression(varDecl.initializer)
            };
        });
    } else if (tsStatement.kind === ts.SyntaxKind.WhileStatement) {
        const whileStatement = <ts.WhileStatement> tsStatement;
        ksStmt = <ks.WhileStatement> {
            type: ks.StatementType.While,
            condition: convertExpression(whileStatement.expression),
            body: convertBlock(<ts.Block>whileStatement.statement),
        };
    } else
        logNodeError(`Unexpected statement kind "${ts.SyntaxKind[tsStatement.kind]}".`);

    return ksStmts || [ksStmt];
}

function flattenArray<T>(arrays: T[][]): T[] {
    return [].concat.apply([], arrays);
}

function convertBlock(tsBlock: ts.BlockLike|ts.Statement): ks.Block {
    if (typeof tsBlock === "undefined") return undefined;

    if ("statements" in tsBlock)
        return { statements: flattenArray((<ts.BlockLike>tsBlock).statements.map(x => convertStatement(x))) };
    else
        return { statements: convertStatement(<ts.Statement>tsBlock) };
}

function createSchemaFromTSTypeInfo(typeInfo: SimpleAst.SourceFile): ks.SchemaFile {
    const schema = <ks.SchemaFile> { enums: {}, classes: {} };
    
    for (const tsEnum of typeInfo.getEnums()) {
        schema.enums[nameToKS(tsEnum.getName())] = <ks.Enum> { 
            values: tsEnum.getMembers().map(tsEnumMember => ({ name: nameToKS(tsEnumMember.getName()) }))
        };
    }

    for (const tsClass of typeInfo.getClasses()) {
        const classSchema = schema.classes[nameToKS(tsClass.getName())] = <ks.Class> { fields: { }, methods: { } };
        
        for (const tsProp of tsClass.getInstanceProperties()) {
            if (!(tsProp instanceof SimpleAst.PropertyDeclaration) && !(tsProp instanceof SimpleAst.ParameterDeclaration))
                continue;

            const fieldSchema = classSchema.fields[nameToKS(tsProp.getName())] = <ks.Field> { 
                type: convertTsType(tsProp.getType().compilerType),
                visibility: tsProp.getScope() === "public" ? ks.Visibility.Public : 
                    tsProp.getScope() === "protected" ? ks.Visibility.Protected : 
                    ks.Visibility.Private,
            };

            const initializer = tsProp.getInitializer();
            if (initializer)
                fieldSchema.defaultValue = initializer.getText();
        }

        for (const tsMethod of tsClass.getInstanceMethods()) {
            const methodSchema = classSchema.methods[nameToKS(tsMethod.getName())] = <ks.Method> { };
            methodSchema.returns = convertTsType(tsMethod.getReturnType().compilerType);
            methodSchema.parameters = tsMethod.getParameters().map(tsParam => convertParameter(tsParam));
            methodSchema.body = convertBlock(<ts.BlockLike> tsMethod.getBody().compilerNode);
        }

        const constructors = tsClass.getConstructors();
        if (constructors.length > 0)
            classSchema.constructor = { 
                parameters: constructors[0].getParameters().map(tsParam => convertParameter(tsParam)),
                body: convertBlock(<ts.BlockLike> constructors[0].getBody().compilerNode),
            };
    }
    return schema;
}

const schema = createSchemaFromTSTypeInfo(sourceFile);
const schemaJson = JSON.stringify(schema, function (k,v) {
    if (["enums", "classes", "items", "methods", "fields"].indexOf(k) !== -1 && Object.keys(v).length === 0) return undefined;
    return v;
}, 4);
//console.log(schemaJson);

const methods = {};
for (let clsName of Object.keys(schema.classes)) {
    const cls = schema.classes[clsName];
    methods[`${clsName}::constructor`] = cls.constructor.body;

    for (let methodName of Object.keys(cls.methods))
        methods[`${clsName}::${methodName}`] = cls.methods[methodName].body;
}

const astJson = JSON.stringify(methods, null, 4);
console.log(astJson);

fs.writeFileSync("ast.json", astJson);

debugger;

