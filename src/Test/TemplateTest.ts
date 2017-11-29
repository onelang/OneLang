import { writeFile, readFile, jsonRequest } from "../Utils/NodeUtils";
import { ObjectComparer } from "./ObjectComparer";
import { ExprLangAst as Ast } from "./ExprLangAst";
import { execFileSync } from "child_process";
import { Tokenizer, Token, TokenizerException } from "./Tokenizer";
import { operators, ExpressionParser } from "./ExpressionParser";
import { AstPrinter } from "./AstPrinter";
const YAML = require('yamljs');

interface TestFile {
    templateTests: { [name: string]: TemplateTest; };
    expressionTests: { [expression: string]: string; };
    expressionAstTests: { [expression: string]: Ast.Expression; };
    tokenizerTests: { [expression: string]: { op?: string, i?: string, n?: string, s?: string }[]; };
}

interface TemplateTest {
    tmpl: string;
    model: object;
    expected: string;
}

// http://journal.stuffwithstuff.com/2011/03/19/pratt-parsers-expression-parsing-made-easy/

const testFile = <TestFile>YAML.parse(readFile("src/Test/TemplateTest.yaml"));

class TestRunner {
    constructor(public testFile: TestFile) { }

    runTokenizerTests() {
        console.log('============== Tokenizer tests ==============');
        for (const expr of Object.keys(testFile.tokenizerTests)) {
            const expectedDesc = testFile.tokenizerTests[expr];
            const expected = Array.isArray(expectedDesc) ? expectedDesc.map(x => 
                x.op ? new Token("operator", x.op) :
                x.i ? new Token("identifier", x.i) : 
                x.n ? new Token("number", x.n) :
                x.s ? new Token("string", x.s) :
                "UNKNOWN") : expectedDesc;

            const summary = ObjectComparer.getFullSummary(expected, () => {
                try {
                    return new Tokenizer(expr, operators).tokens;
                } catch(e) {
                    if (e instanceof TokenizerException)
                        return { errorOffset: e.errorOffset, message: e.message };
                    else
                        throw e;
                }
            });

            console.log(`${expr}: ${summary}`);
        }
    }

    runExpressionTests() {
        console.log('============== Expression tests ==============');
        for (const expr of Object.keys(testFile.expressionTests)) {
            const expected = testFile.expressionTests[expr];
            try {
                const parsed = new ExpressionParser(expr).parse();
                const repr = AstPrinter.removeOuterParen(AstPrinter.print(parsed));
                if (repr.replace(/\s*/g, "") === expected.replace(/\s*/g, "")) {
                    console.log(`${expr}: OK`);
                } else {
                    console.log(`${expr}:`);
                    console.log(`  expected: ${expected}`);
                    console.log(`  got:      ${repr}`);
                }
            } catch(e) {
                console.log(`${expr}: parse error: ${e}`);
            }
        }
    }

    runExpressionAstTests() {
        console.log('============== Expression AST tests ==============');
        for (const expr of Object.keys(testFile.expressionAstTests)) {
            const expected = testFile.expressionAstTests[expr];
            const summary = ObjectComparer.getFullSummary(expected,
                () => new ExpressionParser(expr).parse());
            console.log(`${expr}: ${summary}`);
        }
    }
}

//new ExpressionParser("obj.subObj.method").parse();
const testRunner = new TestRunner(testFile);
testRunner.runTokenizerTests();
testRunner.runExpressionAstTests();
testRunner.runExpressionTests();

//for (const testName of Object.keys(testFile.expressionTests)) {
//    const exprTest = testFile.expressionTests[testName];
//    const parsedExpr = parseExpression(exprTest.expr);
//    console.log(`${testName}`, parsedExpr, exprTest.expected);
//}