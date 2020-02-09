import { runYamlTestSuite, assert } from "./TestUtils";
import { ExprLangParser } from "@one/Generator/ExprLang/ExprLangParser";
import { ExprLangAstPrinter } from '@one/Generator/ExprLang/ExprLangAstPrinter';

runYamlTestSuite("ExprLang-Parser", (expr, expected: string) => {
    const parsed = ExprLangParser.parse(expr);
    const repr = ExprLangAstPrinter.removeOuterParen(ExprLangAstPrinter.print(parsed));
    assert.deepStrictEqual(repr.replace(/\s*/g, ""), expected.replace(/\s*/g, ""));
});