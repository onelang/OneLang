# Expression language: VM

## Implementation

Source: `src/Generator/ExprLang/ExprLangVM.ts`

## Tests

Source: `test/src/TemplateTest.ts` // `runVmTests` method

Test cases: `test/src/TemplateTest.yaml` // `vmTests` nodes

## Description

ExprLang VM can evaluate [ExprLang AST](exprlang-ast.md) expressions. It supports a model (a `VariableContext`) and a `methodHandler` which handles `call` AST nodes.

## Examples

### Example 1

```javascript
import { ExprLangParser, ExprLangVM } from "onelang";

const expr = ExprLangParser.parse("1+2*3");
const result = new ExprLangVM().evaluate(expr);
console.log(result);
```

```javascript
7
```

### Example 2

```javascript
import { ExprLangParser, ExprLangVM, VariableContext, VariableSource } from "onelang";

const expr = ExprLangParser.parse("1 + five * double(data.eight)");
const result = new ExprLangVM().evaluate(expr, new VariableContext([VariableSource.fromObject({ 
    five: 5,
    data: { eight: 8 },
    double: x => x * 2,
 })]));
console.log(result);
```

```javascript
81
```

