# Project structure

## Repositories

### OneLang (core library)

#### Directory structure

* documentation (`docs/`)
* source code parsing (`src/Parsers/`)
* intermediate code model, AST (`src/One/`)
  * code transformations (`src/One/Transforms/`)
* target code generator (`src/Generator/`)
  * ExprLang: expression language (`src/Generator/ExprLang/`)
  * OneTemplate: templating engine (`src/Generator/OneTemplate/`)
* package handling (`src/StdLib/`)
* standard library packages (`packages/`)
* target language definition templates (`langs/`)

Source files in the `src/` directory are written in TypeScript and compiled into JavaScript (`lib/` folder) via `tsc` (TypeScript compiler) using the `tsconfig.json` TypeScript configuration file.

The `packages/` folder contains interface declarations (metadata in `.yaml`, declarations in TypeScript declaration, `.d.ts` files) and native implementations which are written in target languages.