# Repository overview

## OneLang (core library)

* Source: https://github.com/onelang/OneLang
* npm: https://www.npmjs.com/package/onelang
  * install: `npm i onelang`

**>>> Read more at the [OneLang project structure documentation](onelang-project-structure.md) <<<**

## OneCLI

Command line interface for OneLang compiler, written in TypeScript for NodeJS

* Source: https://github.com/onelang/OneCLI
* npm: https://www.npmjs.com/package/onelang-cli
  * install: `npm i -g onelang-cli`
  * usage: `one transpile -t csharp test.ts`
  * help: `one --help`

## OneIDE

Web-based GUI for OneLang compiler, runs in browser, cross-compiles to all languages at the same time. Optionally runs compiled code if a `CompilerBackend` is also available.

* Source: https://github.com/onelang/OneIDE
* Live version: https://ide.onelang.io/

## TestArtifacts

Compiled source codes and exported intermediate model stages generated from test inputs.

* Repository: https://github.com/onelang/TestArtifacts

This repository basically contains the expected output of the test runs. If something changes in this repository then either a new test was added or the compiler was changed in a way which modified the transpilation process and changed how OneLang compiles the code.

## Compiler backend

A backend webservice which can compile and run source code in all target OneLang languages. [Read more about the CompilerBackend here](https://github.com/onelang/OneLang/wiki/Compiler-backend).

* Documentation: https://github.com/onelang/OneLang/wiki/Compiler-backend
* Source: https://github.com/onelang/CompilerBackend
* Docker: https://hub.docker.com/r/onelang/compilerbackend/dockerfile/
    * install: `docker pull onelang/compilerbackend`

## Playground

Temporary files for testing ideas, brainstorming notes and stuff.

* Source: https://github.com/onelang/Playground

You can ignore this repository.