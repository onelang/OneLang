# Expression language: Parser

## Implementation

Source: `src/Generator/ExprLang/ExprLangParser.ts`

## Tests

Source: `test/src/TemplateTest.ts` // `runExpressionTests` and `runExpressionAstTests` methods

Test cases: `test/src/TemplateTest.yaml` // `expressionTests` and `expressionAstTests`  nodes

## Example usage

Code

```javascript
import { ExprLangParser, ExprLangAst } from "onelang";

const expr: ExprLangAst.Expression = ExprLangParser.parse("1+2*3");
console.log(expr);
```

Result

```javascript
{ kind: 'binary',
  op: '+',
  left: { kind: 'literal', type: 'number', value: 1 },
  right:
   { kind: 'binary',
     op: '*',
     left: { kind: 'literal', type: 'number', value: 2 },
     right: { kind: 'literal', type: 'number', value: 3 } } }
```

Code

```javascript
console.log(ExprLangAstPrinter.print(expr));
```

Result

```javascript
(1 + (2 * 3))
```

## Description

ExprLang parser is a modified [Pratt parser based on this article](https://journal.stuffwithstuff.com/2011/03/19/pratt-parsers-expression-parsing-made-easy/). It uses the [tokenizer](exprlang-lexer.md) and builds an [ExprLang AST](exprlang-ast.md) from an ExprLang expression.

The `precedenceLevels` variable tells the parser which operator has precedence over which others. For example `product` (`*`, `/`) is later in the list meaning that it's "stronger" than `sum` (`+`, `-`), so the expression `1 + 2 * 3` will be converted to `1 + (2 * 3)` not to `(1 + 2) * 3`.