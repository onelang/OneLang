# AST (Abstract Syntax Tree)

## Implementation

Source: `src/Generator/ExprLang/ExprLangAst.ts`

## Usage

See the [Parser documentation](exprlang-parser.md) for usage information.

## Description

The ExprLang expressions can be represented as an [Abstract Syntax Tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree).

ExprLang supports the following AST nodes (called expressions, e.g. `BinaryExpression`):

* Binary:
  * format: `<left> <op> <right>`
  * operators: `"+"` (addition), `"-"` (subtract), `"*"` (multiply), `"/"` (division), `"<<"` (left shift), `">>"` (right shift)
  * example: `len - 1` where `left` is `len`, `op` is `-`, `right` is `1`
* Unary:
  * format: `<op> <expr>`
  * operators: `"+"` (positive), `"-"` (negative), `"!"` (not, negate)
  * example: `-position` where `op` is `-`, `expr` is `position`
* Literal:
  * format: has a type (number, string or boolean) and a value of that type
  * value examples: `1234` (number), `"hello"` (string), `true` (boolean)
* Identifier:
  * format: an identifier
  * example: `varName`
* Parenthesized:
  * format: `(<expr>)`
  * example: `(1+2)` where `expr` is `1+2`
* Conditional:
  * format: `<condition> ? <whenTrue> : <whenFalse>`
  * example: `varName ? 1 : 2` where `condition` is `varName`, `whenTrue` is `1`, `whenFalse` is `2`
* Call:
  * format: `<method>(<arguments[0]>, arguments[1], ...)`
  * example: `checkAccess(user, request.password, "adminRole")` where `method` is `checkAccess`, and `arguments` is an array of the following expressions: `user`, `request.password`, `"adminRole"` 
* PropertyAccess:
  * format: `<object>.<propertyName>`
  * example: `request.password` where `object` is `request` and `propertyName` is `password`
* ElementAccess:
  * format: `<object>[<elementExpr>]`
  * example: `user.items[len - 1]` where `object` is `user.items` and `elementExpr` is `len - 1`