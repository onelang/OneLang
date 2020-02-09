import { runYamlTestSuite, assert } from "./TestUtils";
import { Token, ExprLangLexer, ExprLangLexerException } from "@one/Generator/ExprLang/ExprLangLexer";
import { operators } from "@one/Generator/ExprLang/ExprLangParser";

runYamlTestSuite("ExprLang-Lexer", (expr, expectedDesc: { op?: string, i?: string, n?: string, s?: string }[]) => {
    let actual;
    try {
        actual = new ExprLangLexer(expr, operators).tokens;
    } catch(e) {
        if (e instanceof ExprLangLexerException)
            actual = { errorOffset: e.errorOffset, message: e.message };
        else
            throw e;
    }

    const expected = Array.isArray(expectedDesc) ? expectedDesc.map(x => 
        x.op ? new Token("operator", x.op) :
        x.i ? new Token("identifier", x.i) : 
        x.n ? new Token("number", x.n) :
        x.s ? new Token("string", x.s) :
        "UNKNOWN") : expectedDesc;

    assert.deepStrictEqual(actual, expected);
});