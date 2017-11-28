import { writeFile, readFile, jsonRequest } from "../Utils/NodeUtils";
import { ObjectComparer } from "./ObjectComparer";
import { ExprLangAst } from "./ExprLangAst";
import { execFileSync } from "child_process";
import { Tokenizer, Token, TokenizerException } from "./Tokenizer";
const YAML = require('yamljs');

interface TestFile {
    templateTests: { [name: string]: TemplateTest; };
    expressionTests: { [expression: string]: ExprLangAst.Expression; };
    tokenizerTests: { [expression: string]: { op?: string, i?: string, n?: string, s?: string }[]; };
}

interface TemplateTest {
    tmpl: string;
    model: object;
    expected: string;
}

// http://journal.stuffwithstuff.com/2011/03/19/pratt-parsers-expression-parsing-made-easy/

const testFile = <TestFile>YAML.parse(readFile("src/Test/TemplateTest.yaml"));
const operators = ["+", "-", "*", "/", "<<", ">>", "(", ")", ",", ".", "not", "!", "or", "||", "and", "&&"];

type OperatorKind = "binary";

class OperatorInfo {
    text: string;
    kind: OperatorKind;
    precendence: number;
}

function getOperators() {
    const operatorKinds = {
        'binary': ['+', '-', '*', '/', '**', '<<', '>>', 'or', '||', 'and', '&&'],
    };

    const operatorPrecendences = [
        ['='],
        ['?:'],
        ['+', '-'],
        ['*', '/'],
        ['**'],
        ['+', '-'],
    ];
}


class ExpressionParser {
    tokens: Token[];

    constructor(public expression: string) {
        this.tokens = new Tokenizer(expression, operators).tokens;
    }

    consume() { return this.tokens.shift(); }

    parse() {
        //const token = this.consume();
        //if (!token.isOperator) {
        //    return <ExprLangAst.IdentifierExpression> { 
        //        kind: "identifier",
        //        identifier: token.value
        //    };
        //} else if (token.value === 
        return null;
    }
}

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
            const summary = ObjectComparer.getFullSummary(expected,
                () => new ExpressionParser(expr).parse());
            console.log(`${expr}: ${summary}`);
        }
    }
}

console.log(new Tokenizer("'alma'", ["(",")",","]).tokens);
const testRunner = new TestRunner(testFile);
testRunner.runTokenizerTests();
//testRunner.runExpressionTests();

//for (const testName of Object.keys(testFile.expressionTests)) {
//    const exprTest = testFile.expressionTests[testName];
//    const parsedExpr = parseExpression(exprTest.expr);
//    console.log(`${testName}`, parsedExpr, exprTest.expected);
//}