import { runYamlTestSuite, assert } from "../TestUtils";
import { ExprLangParser } from "@one/Generator/ExprLang/ExprLangParser";
import { ExprLangAst } from "@one/Generator/ExprLang/ExprLangAst";

runYamlTestSuite("ExprLang-ParserAst", (expr, expected: ExprLangAst.Expression) => {
    const actual = ExprLangParser.parse(expr);
    assert.deepStrictEqual(actual, expected);
});