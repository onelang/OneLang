import * as ts from "typescript";
import * as SimpleAst from "ts-simple-ast";
import TsSimpleAst from "ts-simple-ast";
import { OneAst as one } from "../One/Ast";
import { deindent } from "../Generator/Utils";

function flattenArray<T>(arrays: T[][]): T[] {
    return [].concat.apply([], arrays);
}

export class TypeScriptParser {
    ast: TsSimpleAst;
    sourceFile: SimpleAst.SourceFile;
    schema: one.Schema;
    currClass: one.Class;
    currMethod: one.Method;

    constructor(public sourceCode: string, filePath?: string) {
        this.ast = new TsSimpleAst();
        this.ast.addSourceFileFromText(filePath || "main.ts", sourceCode);
        this.ast.addSourceFileFromText("/node_modules/typescript/lib/lib.d.ts", "");
        this.sourceFile = this.ast.getSourceFiles()[0];
    }

    static parseFile(sourceCode: string, filePath?: string): one.Schema {
        const parser = new TypeScriptParser(sourceCode, filePath);
        const schema = parser.generate();
        return schema;
    }

    logNodeError(message: string, node?: ts.Node) {
        console.warn(`[TypeScriptParser] ${message}${node ? ` (nodeType: ${ts.SyntaxKind[node.kind]})` : ""}`, node || "");
    }

    convertTsType(tsType: ts.TypeNode) {
        let result: one.Type;

        if (!tsType) {
            result = one.Type.Void;
        } else if (tsType.kind === ts.SyntaxKind.StringKeyword) {
            result = one.Type.Class("TsString");
        } else if (tsType.kind === ts.SyntaxKind.BooleanKeyword) {
            result = one.Type.Class("TsBoolean");
        } else if (tsType.kind === ts.SyntaxKind.NumberKeyword) {
            result = one.Type.Class("TsNumber");
        } else if (tsType.kind === ts.SyntaxKind.AnyKeyword) {
            result = one.Type.Any;
        } else if (tsType.kind === ts.SyntaxKind.TypeReference) {
            const typeRef = <ts.TypeReferenceNode> tsType;
            const typeText = typeRef.typeName.getText();
            
            if (this.currClass.typeArguments.includes(typeText) || this.currMethod.typeArguments.includes(typeText)) {
                result = one.Type.Generics(typeText);
            } else {
                const typeArgs = typeRef.typeArguments;
                result = one.Type.Class(typeText, typeArgs && typeArgs.map(x => this.convertTsType(x)));
            }
        } else {
            this.logNodeError(`Unknown type node`, tsType);
        }

        return result || one.Type.Any;
    }

    convertParameter(tsParam: SimpleAst.ParameterDeclaration) {
        return <one.MethodParameter> {
            name: tsParam.getName(),
            type: this.convertTsType(tsParam.compilerNode.type)
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

            if (newExpr.expression.kind !== ts.SyntaxKind.Identifier)
                this.logNodeError(`Only Identifier can be used as "new" class.`, newExpr.expression);

            const classIdentifier = <ts.Identifier> newExpr.expression;

            return <one.NewExpression> {
                exprKind: one.ExpressionKind.New,
                cls: this.convertExpression(classIdentifier),
                typeArguments: newExpr.typeArguments.map(arg => this.convertTsType(arg)),
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
                literalClassName: "TsString",
                value: literalExpr.text
            };
        } else if (tsExpr.kind === ts.SyntaxKind.NumericLiteral) {
            const literalExpr = <ts.NumericLiteral> tsExpr;
            return <one.Literal> {
                exprKind: one.ExpressionKind.Literal,
                literalType: "numeric",
                literalClassName: "TsNumber",
                value: literalExpr.text
            };
        } else if (tsExpr.kind === ts.SyntaxKind.FalseKeyword || tsExpr.kind === ts.SyntaxKind.TrueKeyword) {
            return <one.Literal> { 
                exprKind: one.ExpressionKind.Literal,
                literalType: "boolean",
                literalClassName: "TsBoolean",
                value: tsExpr.kind === ts.SyntaxKind.TrueKeyword
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
        } else if (tsExpr.kind === ts.SyntaxKind.ObjectLiteralExpression) {
            const expr = <ts.ObjectLiteralExpression> tsExpr;
            return <one.MapLiteral> { 
                exprKind: one.ExpressionKind.MapLiteral,
                properties: expr.properties.map((x: ts.PropertyAssignment) => this.convertVariableDeclaration(x))
            };
        } else if (tsExpr.kind === ts.SyntaxKind.DeleteExpression) {
            const expr = <ts.DeleteExpression> tsExpr;
            const objToDelete = <one.ElementAccessExpression> this.convertExpression(expr.expression);
            if (objToDelete.exprKind !== one.ExpressionKind.ElementAccess) {
                this.logNodeError(`Delete is not supported for this kind of expression: ${ts.SyntaxKind[objToDelete.exprKind]}`, expr);
                return null;
            }

            return <one.CallExpression> {
                exprKind: one.ExpressionKind.Call,
                method: <one.PropertyAccessExpression> {
                    exprKind: one.ExpressionKind.PropertyAccess,
                    object: objToDelete.object,
                    propertyName: "delete"
                },
                arguments: [objToDelete.elementExpr]
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
                this.logNodeError(`Unexpected expression kind.`, tsExpr); 
                return null;
            }
        }
    }

    convertVariableDeclaration(varDecl: ts.VariableDeclaration|ts.PropertyAssignment): one.VariableDeclaration {
        return <one.VariableDeclaration> {
            stmtType: one.StatementType.VariableDeclaration,
            name: varDecl.name.getText(),
            initializer: this.convertExpression(varDecl.initializer)
        };
    }

    convertInitializer(initializer: ts.ForInitializer): one.VariableDeclaration {
        let itemVariable;
        if (initializer.kind === ts.SyntaxKind.VariableDeclarationList) {
            const varDeclList = <ts.VariableDeclarationList> initializer;
            if (varDeclList.declarations.length !== 1)
                this.logNodeError(`Multiple declarations are not supported as for of initializers.`, varDeclList);
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
                stmtType: one.StatementType.ExpressionStatement,
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
                itemVariable: this.convertInitializer(stmt.initializer),
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
        } else if (tsStatement.kind === ts.SyntaxKind.BreakStatement) {
            oneStmt = <one.Statement> { stmtType: one.StatementType.Break };
        } else
            this.logNodeError(`Unexpected statement kind.`, tsStatement);

        oneStmts = oneStmts || (oneStmt ? [oneStmt] : []);

        if (oneStmts.length > 0) {
            const triviaStart = tsStatement.pos;
            const triviaEnd = tsStatement.getStart();
            const realEnd = this.sourceCode.lastIndexOf("\n", triviaEnd) + 1;

            if (realEnd > triviaStart) {
                const trivia = this.sourceCode.substring(triviaStart, realEnd);
                oneStmts[0].leadingTrivia = deindent(trivia);
            }
        }

        return oneStmts;
    }

    convertBlock(tsBlock: ts.BlockLike|ts.Statement): one.Block {
        if (typeof tsBlock === "undefined") return undefined;

        if ("statements" in tsBlock)
            return { statements: flattenArray((<ts.BlockLike>tsBlock).statements.map(x => this.convertStatement(x))) };
        else
            return { statements: this.convertStatement(<ts.Statement>tsBlock) };
    }

    convertVisibility(node: SimpleAst.Node & SimpleAst.ScopedNode) {
        const scope = node.getScope();
        const visibility = scope === "public" ? one.Visibility.Public : 
            scope === "protected" ? one.Visibility.Protected : 
            scope === "private" ? one.Visibility.Private : null;

        if (!visibility)
            this.logNodeError(`Unknown scope / visibility value: ${scope}`, node.compilerNode);

        return visibility;
    }

    generate() {
        const schema = <one.Schema> { globals: {}, enums: {}, classes: {} };
        
        for (const varDecl of this.sourceFile.getVariableDeclarations()) {
            const oneVarDecl = this.convertVariableDeclaration(varDecl.compilerNode);
            oneVarDecl.type = this.convertTsType(varDecl.compilerNode.type);
            schema.globals[varDecl.getName()] = oneVarDecl;
        }

        for (const tsEnum of this.sourceFile.getEnums()) {
            schema.enums[tsEnum.getName()] = <one.Enum> { 
                values: tsEnum.getMembers().map(tsEnumMember => ({ name: tsEnumMember.getName() }))
            };
        }

        for (const tsClass of this.sourceFile.getClasses()) {
            const classSchema = schema.classes[tsClass.getName()] = <one.Class> { fields: {}, methods: {}, properties: {} };
            this.currClass = classSchema;
            classSchema.typeArguments = tsClass.getTypeParameters().map(x => x.compilerNode.name.text);

            for (const tsProp of tsClass.getInstanceProperties()) {
                if (tsProp instanceof SimpleAst.PropertyDeclaration || tsProp instanceof SimpleAst.ParameterDeclaration) {
                    const fieldSchema = classSchema.fields[tsProp.getName()] = <one.Field> { 
                        type: this.convertTsType(tsProp.compilerNode.type),
                        visibility: this.convertVisibility(tsProp)
                    };
    
                    const initializer = tsProp.getInitializer();
                    if (initializer)
                        fieldSchema.defaultValue = initializer.getText();
                } else if (tsProp instanceof SimpleAst.GetAccessorDeclaration) {
                    const propSchema = classSchema.properties[tsProp.getName()] = <one.Property> { 
                        type: this.convertTsType(tsProp.compilerNode.type),
                        visibility: this.convertVisibility(tsProp),
                        getter: this.convertBlock(tsProp.compilerNode.body),
                    };
                } else {
                    this.logNodeError(`Unknown property type`, tsProp.compilerNode);
                }
            }

            const tsMethods = <SimpleAst.MethodDeclaration[]> tsClass.getAllMembers().filter(x => x instanceof SimpleAst.MethodDeclaration);
            for (const tsMethod of tsMethods) {
                const methodSchema = classSchema.methods[tsMethod.getName()] = <one.Method>{};
                this.currMethod = methodSchema;
                methodSchema.typeArguments = tsMethod.getTypeParameters().map(x => x.compilerNode.name.text);
                methodSchema.static = tsMethod.isStatic();
                methodSchema.returns = this.convertTsType(tsMethod.compilerNode.type);
                methodSchema.parameters = tsMethod.getParameters().map(tsParam => this.convertParameter(tsParam));
                const tsBody = tsMethod.getBody();
                methodSchema.body = tsBody && this.convertBlock(<ts.BlockLike> tsBody.compilerNode);
            }

            const constructors = tsClass.getConstructors();
            if (constructors.length > 0)
                classSchema.constructor = { 
                    parameters: constructors[0].getParameters().map(tsParam => this.convertParameter(tsParam)),
                    body: this.convertBlock(<ts.BlockLike> constructors[0].getBody().compilerNode),
                };
        }

        return this.schema = schema;
    }
}
