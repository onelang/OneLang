describe('Expression language (ExprLang)', function () {
    describe('Tokenizer (Lexer) tests', () => require("./lib/ExprLang-LexerTest"));
    describe('Parser tests',            () => require("./lib/ExprLang-ParserTest"));
    describe('Parser AST tests',        () => require("./lib/ExprLang-ParserAstTest"));
    describe('VM tests',                () => require("./lib/ExprLang-VMTest"));
});

describe('OneTemplate', () => require("./lib/OneTemplateTest"));
