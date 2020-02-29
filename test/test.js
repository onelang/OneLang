describe('Expression language (ExprLang)', function () {
    describe('Tokenizer (Lexer) tests', () => require("./lib/testSuites/ExprLang-LexerTest"));
    describe('Parser tests',            () => require("./lib/testSuites/ExprLang-ParserTest"));
    describe('Parser AST tests',        () => require("./lib/testSuites/ExprLang-ParserAstTest"));
    describe('VM tests',                () => require("./lib/testSuites/ExprLang-VMTest"));
});

describe('OneTemplate',          () => require("./lib/testSuites/OneTemplateTest"));
//describe('OneLang Parser tests', () => require("./lib/testSuites/ParserTest"));
//describe("Compilation tests",    () => require("./lib/testSuites/CompilationTest"));
