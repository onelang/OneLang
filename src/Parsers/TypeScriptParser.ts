import * as ts from "typescript";
import * as SimpleAst from "ts-simple-ast";
import { TsSimpleAst } from "ts-simple-ast";
import { OneAst as one } from "../One/Ast";
import { AstHelper } from "../One/AstHelper";

function flattenArray<T>(arrays: T[][]): T[] {
    return [].concat.apply([], arrays);
}

export class TypeScriptParser {
    ast: TsSimpleAst;

    constructor() {
        this.ast = new (SimpleAst.TsSimpleAst || SimpleAst["default"])();
    }

    static parseFile(sourceCode: string, filePath?: string): one.Schema {
        const parser = new TypeScriptParser();
        parser.ast.addSourceFileFromText(filePath || "main.ts", sourceCode);
        parser.ast.addSourceFileFromText("/node_modules/typescript/lib/lib.d.ts", "");
        const sourceFile = parser.ast.getSourceFiles()[0];
        const schema = parser.createSchemaFromSourceFile(sourceFile);
        return schema;
    }

    logNodeError(message: string, node?: Node) {
        console.warn(`[TypeScriptParser] ${message}`, node || "");
    }

    convertTsType(tsType: ts.Type) {
        const result = new one.Type();

        const typeText = (<any>tsType).intrinsicName || tsType.symbol.name;
        if (typeText === "number")
            result.typeKind = one.TypeKind.Number;
        else if (typeText === "string")
            result.typeKind = one.TypeKind.String;
        else if (typeText === "boolean")
            result.typeKind = one.TypeKind.Boolean;
        else if (typeText === "void")
            result.typeKind = one.TypeKind.Void;
        else {
            const isArray = typeText === "Array";
            result.typeKind = isArray ? one.TypeKind.Array : 
                one.TypeKind.Class;
            
            if(!isArray)
                result.className = typeText;

            const typeArgs = <ts.Type[]>(<any>tsType).typeArguments;
            if (typeArgs)
                result.typeArguments = typeArgs.map(x => this.convertTsType(x));
        }

        return result;
    }

    convertParameter(tsParam: SimpleAst.ParameterDeclaration) {
        return <one.MethodParameter> {
            name: tsParam.getName(),
            type: this.convertTsType(tsParam.getType().compilerType)
        };
    }

    convertExpression(tsExpr: ts.Expression): one.Expression {
        if (typeof tsExpr === "undefined") return undefined;

        if (tsExpr.kind === ts.SyntaxKind.CallExpression) {
            const callExpr = <ts.CallExpression> tsExpr;
            return <one.CallExpression> {
                exprKind: one.ExpressionKind.Call,
                method: this.convertExpression(callExpr.expression),
                arguments: callExpr.arguments.map(arg => this.convertExpression(arg))
            };
        } else if (tsExpr.kind === ts.SyntaxKind.BinaryExpression) {
            const binaryExpr = <ts.BinaryExpression> tsExpr;
            return <one.BinaryExpression> {
                exprKind: one.ExpressionKind.Binary,
                left: this.convertExpression(binaryExpr.left),
                right: this.convertExpression(binaryExpr.right),
                operator: binaryExpr.operatorToken.getText()
            };
        } else if (tsExpr.kind === ts.SyntaxKind.PropertyAccessExpression) {
            const propAccessExpr = <ts.PropertyAccessExpression> tsExpr;
            return <one.PropertyAccessExpression> {
                exprKind: one.ExpressionKind.PropertyAccess,
                object: this.convertExpression(propAccessExpr.expression),
                propertyName: propAccessExpr.name.text,
            };
        } else if (tsExpr.kind === ts.SyntaxKind.ElementAccessExpression) {
            const elementAccessExpr = <ts.ElementAccessExpression> tsExpr;
            return <one.ElementAccessExpression> {
                exprKind: one.ExpressionKind.ElementAccess,
                object: this.convertExpression(elementAccessExpr.expression),
                elementExpr: this.convertExpression(elementAccessExpr.argumentExpression)
            };
        } else if (tsExpr.kind === ts.SyntaxKind.Identifier) {
            const identifier = <ts.Identifier> tsExpr;
            return <one.Identifier> { 
                exprKind: one.ExpressionKind.Identifier,
                text: identifier.text
            };
        } else if (tsExpr.kind === ts.SyntaxKind.NewExpression) {
            const newExpr = <ts.NewExpression> tsExpr;
            return <one.NewExpression> { 
                exprKind: one.ExpressionKind.New,
                class: this.convertExpression(newExpr.expression),
                arguments: newExpr.arguments.map(arg => this.convertExpression(arg))
            };
        } else if (tsExpr.kind === ts.SyntaxKind.ConditionalExpression) {
            const condExpr = <ts.ConditionalExpression> tsExpr;
            return <one.ConditionalExpression> { 
                exprKind: one.ExpressionKind.Conditional,
                condition: this.convertExpression(condExpr.condition),
                whenTrue: this.convertExpression(condExpr.whenTrue),
                whenFalse: this.convertExpression(condExpr.whenFalse),
            };
        } else if (tsExpr.kind === ts.SyntaxKind.StringLiteral) {
            const literalExpr = <ts.StringLiteral> tsExpr;
            return <one.Literal> {
                exprKind: one.ExpressionKind.Literal,
                literalType: "string",
                value: literalExpr.text
            };
        } else if (tsExpr.kind === ts.SyntaxKind.NumericLiteral) {
            const literalExpr = <ts.NumericLiteral> tsExpr;
            return <one.Literal> {
                exprKind: one.ExpressionKind.Literal,
                literalType: "numeric",
                value: literalExpr.text
            };
        } else if (tsExpr.kind === ts.SyntaxKind.FalseKeyword || tsExpr.kind === ts.SyntaxKind.TrueKeyword) {
            return <one.Literal> { 
                exprKind: one.ExpressionKind.Literal,
                literalType: "boolean",
                value: tsExpr.getText()
            };
        } else if (tsExpr.kind === ts.SyntaxKind.NullKeyword) {
            return <one.Literal> { 
                exprKind: one.ExpressionKind.Literal,
                literalType: "null",
                value: "null"
            };
        } else if (tsExpr.kind === ts.SyntaxKind.ParenthesizedExpression) {
            const parenExpr = <ts.ParenthesizedExpression> tsExpr;
            return <one.ParenthesizedExpression> { 
                exprKind: one.ExpressionKind.Parenthesized,
                expression: this.convertExpression(parenExpr.expression)
            };
        } else if (tsExpr.kind === ts.SyntaxKind.PostfixUnaryExpression) {
            const unaryExpr = <ts.PostfixUnaryExpression> tsExpr;
            return <one.UnaryExpression> { 
                exprKind: one.ExpressionKind.Unary,
                unaryType: "postfix",
                operator: 
                    unaryExpr.operator === ts.SyntaxKind.PlusPlusToken ? "++" : 
                    unaryExpr.operator === ts.SyntaxKind.MinusMinusToken ? "--" : null,
                operand: this.convertExpression(unaryExpr.operand)
            };
        } else if (tsExpr.kind === ts.SyntaxKind.PrefixUnaryExpression) {
            const unaryExpr = <ts.PrefixUnaryExpression> tsExpr;
            return <one.UnaryExpression> { 
                exprKind: one.ExpressionKind.Unary,
                unaryType: "prefix",
                operator: 
                    unaryExpr.operator === ts.SyntaxKind.PlusPlusToken ? "++" : 
                    unaryExpr.operator === ts.SyntaxKind.MinusMinusToken ? "--" : 
                    unaryExpr.operator === ts.SyntaxKind.PlusToken ? "+" : 
                    unaryExpr.operator === ts.SyntaxKind.MinusToken ? "-" : 
                    unaryExpr.operator === ts.SyntaxKind.TildeToken ? "~" : 
                    unaryExpr.operator === ts.SyntaxKind.ExclamationToken ? "!" : null,
                operand: this.convertExpression(unaryExpr.operand)
            };
        } else if (tsExpr.kind === ts.SyntaxKind.ArrayLiteralExpression) {
            const expr = <ts.ArrayLiteralExpression> tsExpr;
            return <one.ArrayLiteral> { 
                exprKind: one.ExpressionKind.ArrayLiteral,
                items: expr.elements.map(x => this.convertExpression(x))
            };
        } else {
            const kindName = ts.SyntaxKind[tsExpr.kind];
            const knownKeywords = ["this", "super"];
            const keyword = knownKeywords.find(x => kindName.toLowerCase() === `${x}keyword`);
            if (keyword) {
                return <one.Identifier> {
                    exprKind: one.ExpressionKind.Identifier,
                    text: keyword
                };
            } else {
                this.logNodeError(`Unexpected expression kind "${ts.SyntaxKind[tsExpr.kind]}".`); 
                return null;
            }
        }
    }

    convertVariableDeclaration(varDecl: ts.VariableDeclaration): one.VariableDeclaration {
        return <one.VariableDeclaration> {
            stmtType: one.StatementType.Variable,
            variableName: varDecl.name.getText(),
            initializer: this.convertExpression(varDecl.initializer)
        };
    }

    convertInitializer(initializer: ts.ForInitializer): one.VariableDeclaration {
        let itemVariable;
        if (initializer.kind === ts.SyntaxKind.VariableDeclarationList) {
            const varDeclList = <ts.VariableDeclarationList> initializer;
            if (varDeclList.declarations.length !== 1)
                this.logNodeError(`Multiple declarations are not supported as for of initializers.`);
            itemVariable = this.convertVariableDeclaration(varDeclList.declarations[0]);
        } else
            this.logNodeError(`${ts.SyntaxKind[initializer.kind]} is not supported yet as for of initializer.`);

        return itemVariable;
    }

    convertStatement(tsStatement: ts.Statement): one.Statement[] {
        if (typeof tsStatement === "undefined") return undefined;

        let oneStmt: one.Statement = null;
        let oneStmts: one.Statement[] = null;

        if (tsStatement.kind === ts.SyntaxKind.IfStatement) {
            const ifStatement = <ts.IfStatement> tsStatement;
            oneStmt = <one.IfStatement> {
                stmtType: one.StatementType.If,
                condition: this.convertExpression(ifStatement.expression),
                then: this.convertBlock(ifStatement.thenStatement),
                else: this.convertBlock(ifStatement.elseStatement),
            };
        } else if (tsStatement.kind === ts.SyntaxKind.ReturnStatement) {
            const returnStatement = <ts.ReturnStatement> tsStatement;
            oneStmt = <one.ReturnStatement> {
                stmtType: one.StatementType.Return,
                expression: this.convertExpression(returnStatement.expression),
            };
        } else if (tsStatement.kind === ts.SyntaxKind.ThrowStatement) {
            const throwStatement = <ts.ReturnStatement> tsStatement;
            oneStmt = <one.ThrowStatement> {
                stmtType: one.StatementType.Throw,
                expression: this.convertExpression(throwStatement.expression),
            };
        } else if (tsStatement.kind === ts.SyntaxKind.ExpressionStatement) {
            const expressionStatement = <ts.ExpressionStatement> tsStatement;
            oneStmt = <one.ExpressionStatement> {
                stmtType: one.StatementType.Expression,
                expression: this.convertExpression(expressionStatement.expression),
            };
        } else if (tsStatement.kind === ts.SyntaxKind.VariableStatement) {
            const variableStatement = <ts.VariableStatement> tsStatement;
            oneStmts = variableStatement.declarationList.declarations.map(x => this.convertVariableDeclaration(x));
        } else if (tsStatement.kind === ts.SyntaxKind.WhileStatement) {
            const whileStatement = <ts.WhileStatement> tsStatement;
            oneStmt = <one.WhileStatement> {
                stmtType: one.StatementType.While,
                condition: this.convertExpression(whileStatement.expression),
                body: this.convertBlock(<ts.Block>whileStatement.statement),
            };
        } else if (tsStatement.kind === ts.SyntaxKind.ForOfStatement) {
            const stmt = <ts.ForOfStatement> tsStatement;
            oneStmt = <one.ForeachStatement> {
                stmtType: one.StatementType.Foreach,
                varName: this.convertInitializer(stmt.initializer).variableName,
                items: this.convertExpression(stmt.expression),
                body: this.convertBlock(stmt.statement)
            };
        } else if (tsStatement.kind === ts.SyntaxKind.ForStatement) {
            const stmt = <ts.ForStatement> tsStatement;
            oneStmt = <one.ForStatement> {
                stmtType: one.StatementType.For,
                itemVariable: this.convertInitializer(stmt.initializer),
                condition: this.convertExpression(stmt.condition),
                incrementor: this.convertExpression(stmt.incrementor),
                body: this.convertBlock(stmt.statement)                
            };
        } else
            this.logNodeError(`Unexpected statement kind "${ts.SyntaxKind[tsStatement.kind]}".`);

        return oneStmts || (oneStmt ? [oneStmt] : []);
    }

    convertBlock(tsBlock: ts.BlockLike|ts.Statement): one.Block {
        if (typeof tsBlock === "undefined") return undefined;

        if ("statements" in tsBlock)
            return { statements: flattenArray((<ts.BlockLike>tsBlock).statements.map(x => this.convertStatement(x))) };
        else
            return { statements: this.convertStatement(<ts.Statement>tsBlock) };
    }

    createSchemaFromSourceFile(typeInfo: SimpleAst.SourceFile): one.Schema {
        const schema = <one.Schema> { enums: {}, classes: {} };
        
        for (const tsEnum of typeInfo.getEnums()) {
            schema.enums[tsEnum.getName()] = <one.Enum> { 
                values: tsEnum.getMembers().map(tsEnumMember => ({ name: tsEnumMember.getName() }))
            };
        }

        for (const tsClass of typeInfo.getClasses()) {
            const classSchema = schema.classes[tsClass.getName()] = <one.Class> { fields: { }, methods: { } };
            
            for (const tsProp of tsClass.getInstanceProperties()) {
                if (!(tsProp instanceof SimpleAst.PropertyDeclaration) && !(tsProp instanceof SimpleAst.ParameterDeclaration))
                    continue;

                const fieldSchema = classSchema.fields[tsProp.getName()] = <one.Field> { 
                    type: this.convertTsType(tsProp.getType().compilerType),
                    visibility: tsProp.getScope() === "public" ? one.Visibility.Public : 
                        tsProp.getScope() === "protected" ? one.Visibility.Protected : 
                        one.Visibility.Private,
                };

                const initializer = tsProp.getInitializer();
                if (initializer)
                    fieldSchema.defaultValue = initializer.getText();
            }

            for (const tsMethod of tsClass.getInstanceMethods()) {
                const methodSchema = classSchema.methods[tsMethod.getName()] = <one.Method> { };
                methodSchema.returns = this.convertTsType(tsMethod.getReturnType().compilerType);
                methodSchema.parameters = tsMethod.getParameters().map(tsParam => this.convertParameter(tsParam));
                methodSchema.body = this.convertBlock(<ts.BlockLike> tsMethod.getBody().compilerNode);
            }

            const constructors = tsClass.getConstructors();
            if (constructors.length > 0)
                classSchema.constructor = { 
                    parameters: constructors[0].getParameters().map(tsParam => this.convertParameter(tsParam)),
                    body: this.convertBlock(<ts.BlockLike> constructors[0].getBody().compilerNode),
                };
        }

        AstHelper.fillNames(schema);
        return schema;
    }
}
