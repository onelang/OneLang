# OneLang (core library) project structure

## Directory structure

* documentation (`docs/`)
* source code of OneLang - TypeScript code (`src/`)
* compiled code of OneLang - JavaScript code (`lib/`)
* source code parsing (`src/Parsers/`)
* intermediate code model, AST (`src/One/`)
  * code transformations (`src/One/Transforms/`)
* target code generator (`src/Generator/`)
  * [ExprLang: expression language](expression-language.md) (`src/Generator/ExprLang/`)
  * OneTemplate: templating engine (`src/Generator/OneTemplate/`)
* package handling (`src/StdLib/`)
* standard library packages (`packages/`)
  * OneLang interface declarations (`packages/interfaces/`)
    * metadata in `.yaml` files
    * declarations in TypeScript declaration `.d.ts` files
  * native implementations which are written in target languages (`packages/implementations/`)
* target language definition templates (`langs/`)
* tests (`test/`)
  * source code of the testing program (`test/src/`)
  * test inputs (`test/input/<testname>.ts`)
    * source code which compiled to other languages (and stored in the `artifacts` subfolder)
  * test artifacts (`test/artifacts/<testname>/`)
    * compiled codes and exported intermediate model stages to diff changes
    * submodule to `TestArtifacts` repository

Source files in the `src/` directory are written in TypeScript and compiled into JavaScript (`lib/` folder) via `tsc` (TypeScript compiler) using the `tsconfig.json` TypeScript configuration file.

