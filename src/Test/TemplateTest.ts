import { writeFile, readFile, jsonRequest } from "../Utils/NodeUtils";
import { ObjectComparer } from "./ObjectComparer";
import { ExprLangAst as ExprAst } from "./ExprLangAst";
import { execFileSync } from "child_process";
import { Tokenizer, Token, TokenizerException } from "./Tokenizer";
import { operators, ExpressionParser } from "./ExpressionParser";
import { ExprAstPrinter } from "./AstPrinter";
import { ExprLangVM, JSMethodHandler, VariableContext, VariableSource } from "./ExprLangVM";
import { ParamParser } from "./ParamParser";
import { TemplatePart, TemplatePartType } from "./TemplatePart";
import { TemplateParser } from "./TemplateParser";
import { TemplateAst as TmplAst } from "./TemplateAst";
import { TemplateGenerator, TemplateMethod } from "./TemplateGenerator";
import { TemplateAstPrinter } from "./TemplateAstPrinter";
const YAML = require('yamljs');

interface TestFile {
    templateTests: { [name: string]: { 
        tmpl: string;
        model: object;
        expected: string;
        methods: { [name: string]: string };
    }; };

    expressionTests: { [expression: string]: string; };
    expressionAstTests: { [expression: string]: ExprAst.Expression; };
    vmTests: { [expression: string]: { expected: any; model?: any; }; };
    tokenizerTests: { [expression: string]: { op?: string, i?: string, n?: string, s?: string }[]; };
}

const testFile = <TestFile>YAML.parse(readFile("src/Test/TemplateTest.yaml"));

function printTemplateAst(name: string, tmplAst: TmplAst.Block) {
    const tmplAstJson = JSON.stringify(tmplAst, null, 4);
    writeFile(`generated/TemplateTests/${name}.json`, tmplAstJson);

    const tmplSummary = new TemplateAstPrinter().print(tmplAst);
    writeFile(`generated/TemplateTests/${name}.txt`, tmplSummary);
}

class TestRunner {
    failedTests = [];

    constructor(public testFile: TestFile) { }

    runTests<T>(tests: { [name: string]: T }, callback: (name: string, test: T) => boolean) {
        if (!tests) return;

        for (const name of Object.keys(tests)) {
            const test = tests[name];
            try {
                if (!callback(name, test))
                    this.failedTests.push(name);
            } catch(e) {
                console.log(`${name}: ERROR: ${e}`);
                this.failedTests.push(name);
            }
        }
    }

    runTokenizerTests() {
        console.log('\n============== Tokenizer tests ==============');
        this.runTests(testFile.tokenizerTests, (expr, expectedDesc) => {
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
            return summary === "OK";
        });
    }

    runExpressionTests() {
        console.log('\n============== Expression tests ==============');
        this.runTests(testFile.expressionTests, (expr, expected) => {
            const parsed = new ExpressionParser(expr).parse();
            const repr = ExprAstPrinter.removeOuterParen(ExprAstPrinter.print(parsed));
            if (repr.replace(/\s*/g, "") === expected.replace(/\s*/g, "")) {
                console.log(`${expr}: OK`);
                return true;
            } else {
                console.log(`${expr}:`);
                console.log(`  expected: ${expected}`);
                console.log(`  got:      ${repr}`);
            }
        });
    }

    runExpressionAstTests() {
        console.log('\n============== Expression AST tests ==============');
        this.runTests(testFile.expressionAstTests, (expr, expected) => {
            const summary = ObjectComparer.getFullSummary(expected,
                () => new ExpressionParser(expr).parse());
            console.log(`${expr}: ${summary}`);
            return summary === "OK";
        });
    }

    runVmTests() {
        console.log('\n============== Expression VM tests ==============');

        const model = {
            sum(a,b) { return a + b; },
            obj: {
                a: 5,
                b: 6,
                method(c) { return this.a + this.b + c; }
            }
        };
        const vm = new ExprLangVM();
        vm.methodHandler = new JSMethodHandler();

        this.runTests(testFile.vmTests, (exprStr, test) => {
            const expr = new ExpressionParser(exprStr).parse();

            const varContext = new VariableContext([
                VariableSource.fromObject(model, "test runner model"),
                VariableSource.fromObject(test.model, "test model")
            ]);

            const result = vm.evaluate(expr, varContext);
            const ok = result === test.expected;
            console.log(`${exprStr}: ${ok ? "OK" : "FAIL"} (${ok ? result : `got: ${result}, expected: ${test.expected}`})`);
            return ok;
        });
    }

    runTemplateTests() {
        console.log('\n============== Template tests ==============');

        this.runTests(testFile.templateTests, (name, test) => {
            const model = {
                hasKey(obj, key) { return typeof obj[key] !== "undefined"; },
            };

            const tmplAst = TemplateParser.parse(test.tmpl);
            printTemplateAst(name, tmplAst);
            
            const varContext = new VariableContext([
                VariableSource.fromObject(model, "test runner model"),
                VariableSource.fromObject(test.model, "test model")
            ]);

            const tmplGen = new TemplateGenerator(varContext);
            for (const signature of Object.keys(test.methods || [])) {
                const method = TemplateMethod.fromSignature(signature, test.methods[signature]);
                tmplGen.addMethod(method);
                printTemplateAst(`${name}_${method.name}`, method.body);
            }
            const result = tmplGen.generate(tmplAst);
            const expected = (test.expected || "").replace(/\\n/g, "\n");
            const ok = result === expected;
            if (result.includes("\n") || expected.includes("\n")) {
                if (ok) {
                    console.log(`${name}: OK ('${result.replace(/\n/g, "\\n")}')`);
                } else {
                    console.log(`${name}: FAIL\n  Got:\n    ${result.replace(/\n/g, "\n    ")}\n  Expected:\n    ${expected.replace(/\n/g, "\n    ")}`);
                }
            } else {
                console.log(`${name}: ${ok ? "OK" : "FAIL"} (${ok ? `'${result}'` : `got: '${result}', expected: '${expected}'`})`);
            }
            return ok;
        });
    }
}

const testRunner = new TestRunner(testFile);
testRunner.runTokenizerTests();
testRunner.runExpressionAstTests();
testRunner.runExpressionTests();
testRunner.runVmTests();
testRunner.runTemplateTests();

console.log(`\nTest summary: ${testRunner.failedTests.length === 0 ? "ALL SUCCESS" : 
    `FAIL (${testRunner.failedTests.join(", ")})`}`);
