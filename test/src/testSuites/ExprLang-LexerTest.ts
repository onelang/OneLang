import { runYamlTestSuite, assert } from "../TestUtils";
import { Token, ExprLangLexer, ExprLangLexerException, TokenKind } from "@one/Generator/ExprLang/ExprLangLexer";
import { ExprLangParser } from "@one/Generator/ExprLang/ExprLangParser";

runYamlTestSuite("ExprLang-Lexer", (expr, expectedDesc: { op?: string, i?: string, n?: string, s?: string }[]) => {
    let actual;
    try {
        actual = new ExprLangLexer(expr, ExprLangParser.operators).tokens;
    } catch(e) {
        if (e instanceof ExprLangLexerException)
            actual = { errorOffset: e.errorOffset, message: e.message };
        else
            throw e;
    }

    const expected = Array.isArray(expectedDesc) ? expectedDesc.map(x => 
        x.op ? new Token(TokenKind.Operator, x.op) :
        x.i ? new Token(TokenKind.Identifier, x.i) : 
        x.n ? new Token(TokenKind.Number, x.n) :
        x.s ? new Token(TokenKind.String, x.s) :
        "UNKNOWN") : expectedDesc;

    assert.deepStrictEqual(actual, expected);
});