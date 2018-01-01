import * as one from "../StdLib/one";
import { OneAst as ast } from "../One/Ast";
import { Reader } from "./Common/Reader";

export class TypeScriptParser2 {
    context: string[] = [];
    reader: Reader;
    expressionParser: ExpressionParser;

    constructor(source: string) {
        this.reader = new Reader(source);
        this.reader.errorCallback = error => {
            throw new Error(`[TypeScriptParser] ${error.message} at ${error.cursor.line}:${error.cursor.column}: "${this.reader.preview}" (context: ${this.context.join("/")})`);
        };
    }

    parseType() {
        const typeName = this.reader.readIdentifier();

        let type: ast.Type;
        if (typeName === "string") {
            type = ast.Type.Class("TsString");
        } else if (typeName === "boolean") {
            type = ast.Type.Class("TsBoolean");
        } else if (typeName === "number") {
            type = ast.Type.Class("TsNumber");
        } else {
            type = ast.Type.Class(typeName);
            if (this.reader.readToken("<")) {
                do {
                    const generics = this.parseType();
                    type.typeArguments.push(generics);
                } while(this.reader.readToken(","));
                this.reader.expectToken(">");
            }
        }

        while (this.reader.readToken("[]"))
            type = ast.Type.Class("TsArray", [type]);

        return type;
    }

    parseExpression() {
        this.fail("expression parsing is not implemented yet");
        return null;
    }

    parseVarDeclTypeAndInit(varDecl: ast.VariableDeclaration, optional: boolean = false) {
        if (this.reader.readToken(":"))
            varDecl.type = this.parseType();

        if (this.reader.readToken("="))
            varDecl.initializer = this.parseExpression();

        if (!optional && varDecl.type === null && varDecl.initializer === null)
            this.reader.fail(`expected type declaration or initializer`);
    }

    parseBlock() {
        const block = <ast.Block> { statements: [] };

        this.reader.expectToken("{");
        if (this.reader.readToken("}")) return block;

        do {
            let statement: ast.Statement = null;

            const leadingTrivia = this.reader.readLeadingTrivia();

            const varDeclMatches = this.reader.readRegex("(const|let|var)\\b");
            if (varDeclMatches !== null) {
                const varDecl = statement = <ast.VariableDeclaration> { stmtType: ast.StatementType.VariableDeclaration };
                varDecl.name = this.reader.expectIdentifier("expected variable name");
                this.parseVarDeclTypeAndInit(varDecl);
            }

            if (statement === null)
                this.reader.fail("unknown statement");

            this.reader.expectToken(";");
            block.statements.push(statement);
        } while(!this.reader.readToken("}"));

        return block;
    }

    tryToParseClass() {
        if (!this.reader.readToken("class")) return null;

        const cls = <ast.Class> { methods: {}, fields: {} };
        cls.name = this.reader.expectIdentifier("expected identifier after 'class' keyword");
        this.context.push(`C:${cls.name}`);

        this.reader.expectToken("{");
        while(!this.reader.readToken("}")) {
            const leadingTrivia = this.reader.readLeadingTrivia();

            const modifiers = this.reader.readModifiers(["static", "public", "protected", "private"]);
            const isStatic = modifiers.includes("static");
            const visibility = modifiers.includes("private") ? ast.Visibility.Private :
                modifiers.includes("protected") ? ast.Visibility.Protected : ast.Visibility.Public;

            const memberName = this.reader.readIdentifier();
            if (this.reader.readToken("(")) { // method
                const method = <ast.Method> { name: memberName, static: isStatic, visibility, leadingTrivia, parameters: [] };
                cls.methods[method.name] = method;
                this.context.push(`M:${method.name}`);

                if (!this.reader.readToken(")")) {
                    do {
                        const param = <ast.MethodParameter> {};
                        method.parameters.push(param);
    
                        param.name = this.reader.readIdentifier();
                        this.context.push(`arg:${param.name}`);
                        this.parseVarDeclTypeAndInit(param);
                        this.context.pop();
                    } while (this.reader.readToken(","));
    
                    this.reader.expectToken(")");
                }

                if (this.reader.readToken(":"))
                    method.returns = this.parseType();

                method.body = this.parseBlock();

                this.context.pop();
            } else {
                const field = <ast.Field> { name: memberName, static: isStatic, visibility, leadingTrivia };
                cls.fields[field.name] = field;
                this.context.push(`F:${field.name}`);

                this.parseVarDeclTypeAndInit(field);
                this.reader.expectToken(";");

                this.context.pop();
            }
        }

        this.context.pop();
        return cls;
    }

    parseFile() {
        while (!this.reader.eof) {
            const leadingTrivia = this.reader.readLeadingTrivia();
            const cls = this.tryToParseClass();
            if (cls === null)
                this.reader.fail("expected 'class' here");
        }
    }

    parse() {
        this.parseFile();
    }
}