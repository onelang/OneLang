import { runYamlTestSuite, assert } from "./TestUtils";
import { ExprLangParser } from "@one/Generator/ExprLang/ExprLangParser";
import { ExprLangVM, VariableContext, VariableSource } from "@one/Generator/ExprLang/ExprLangVM";

runYamlTestSuite("ExprLang-VM", (exprStr, test: { expected: any; model?: any; }) => {
    const model = {
        sum(a,b) { return a + b; },
        obj: {
            a: 5,
            b: 6,
            method(c) { return this.a + this.b + c; }
        }
    };

    const vm = new ExprLangVM();
    const expr = ExprLangParser.parse(exprStr);

    const varContext = new VariableContext([
        VariableSource.fromObject(model, "test runner model"),
        VariableSource.fromObject(test.model, "test model")
    ]);

    const result = vm.evaluate(expr, varContext);
    assert.deepStrictEqual(result, test.expected);
});

