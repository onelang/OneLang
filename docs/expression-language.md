# ExprLang: expression language

## Implementation

Source: `src/Generator/ExprLang/`

## Description

The OneLang expression language can parse expressions like `!arr[5].method(1 + 3 * 6, "string") && name != 'waldo'` and evaluates over a model, calculating the expression's value.

It has the following parts:

* [Tokenizer (lexer)](expr-lexer.md)
* [AST (Abstract Syntax Tree)](exprlang-ast.md)
* [Parser](exprlang-parser.md)

