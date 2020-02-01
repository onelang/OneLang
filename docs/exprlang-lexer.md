# Tokenizer (lexer)

## Implementation

Source: `src/Generator/ExprLang/ExprLangLexer.ts`

## Tests

Source: `test/src/TemplateTest.ts` // `runTokenizerTests` method

Test cases: `test/src/TemplateTest.yaml` // `tokenizerTests` node

## Example usage

Code

```typescript
import { ExprLangLexer } from "onelang";

const lexer = new ExprLangLexer("1+2*3", ['+', '*']);
console.log(lexer.tokens);
```

Result

```ruby
[ Token { kind: 'number', value: '1' },
  Token { kind: 'operator', value: '+' },
  Token { kind: 'number', value: '2' },
  Token { kind: 'operator', value: '*' },
  Token { kind: 'number', value: '3' } ]
```

## Description

ExprLang tokenizer converts the expression into an array of these 4 types of tokens:

* number
  * matches regex: `[+-]?(\\d*\\.\\d+|\\d+\\.\\d+|0x[0-9a-fA-F_]+|0b[01_]+|[0-9_]+)`
  * numbers in the above example: `5`, `1`, `3`, `6`
  * other examples: `1234`, `-5`, `1.3`, `.3` (=0.3), `0b1000` (=8 in binary), `0xA` (=10 in hex), `123_4` (=1234, `_`s are ignored)
* identifier
  * matches regex: `[a-zA-Z_][a-zA-Z0-9_]*`
  * identifies in the above example: `arr`, `method`, `name`
  * other examples: `true`, `false`, `var`, `string`, `variableName`, `HelloWorld`, `_test123` (none of them has special meaning)
* string
  * matches regex: `'(\\'|[^'])*'` or `"(\\"|[^"])*"`
  * strings in the above example: `"string"`, `'waldo'`
  * other examples: `'John\'s car'`, `"HelloWorld"`
* operator
  * operators are configurable (array of strings) and not specified by the tokenizer, but the parser
  * operators in the above example: `!`, `[`, `]`, `.`, `(`, `+`, `*`, `)`, `&&`, `!=`
  * operators supported by the parser: `"**", "+", "-", "*", "/", "<<", ">>", ">=", "!=", "==", "<=", "<", ">", "~", "(", ")", "[", "]", ",", ".", "?", ":", "not", "!", "or", "||", "and", "&&"`

Number, identfier and string tokens are called literals.

ExprLang skips whitespaces: space (`' '`), tab (`'\t'`), newline (`'\n'`) and carriage return (`'\r'`)

An expression can be started with a number (e.g. `-5`) or an optional operator (eg. `-`) and a literal (`varName`). Then any number of operator and literal pair can follow, but the expression cannot end with an operator.

If the expression starts with `-5`, it become a number of value `-5` and NOT the operator of `-` and the number of `5`.

Operator order matters, if `*` would be before `**` then the expression `2 ** 5` would be invalid as it would detect two `*` operators after each other instead of a single `**` operator. (**TODO:** fix this by sorting operators by length descending)