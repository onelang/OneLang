import { runYamlTestSuite, assert } from "../TestUtils";
import { ExprLangParser } from "@one/Generator/ExprLang/ExprLangParser";
import { IExpression } from "@one/Generator/ExprLang/ExprLangAst";

runYamlTestSuite("ExprLang-ParserAst", (expr, expected: IExpression) => {
    const actual = ExprLangParser.parse(expr);
    assert.deepEqual(actual, expected);
});