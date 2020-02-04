# Expression language: VM

## Implementation

Source: `src/Generator/ExprLang/ExprLangVM.ts`

## Tests

Source: `test/src/TemplateTest.ts` // `runVmTests` method

Test cases: `test/src/TemplateTest.yaml` // `vmTests` nodes

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

## Description

ExprLang VM can evaluate [ExprLang AST](exprlang-ast.md) expressions and calculates their value.

The VM supports variables (see `VariableContext` class) which can come from multiple sources (see `VariableSource` class). The variables from various sources are merged: e.g. if `SourceA` contains `varA` and `SourceB` contains `varB` then the context will see both `varA` and `varB`. If a variable name conflicts then the newer variable will be used (the one which specified the latest in the variable source list). 

> Tip: the `VariableSource.fromObject` method converts a native JavaScript object into a variable source.

If the model contains object (e.g. `data.value`) or function variables (`mymath.calc()`) then a `IModelHandler` determines how to handle method calls (via `methodCall` function) and how to access object fields (via `memberAccess` function). If no `IModelHandler` supplied then the VM will use `JSModelHandler` by default which implements native JavaScript method calls and field accesses.