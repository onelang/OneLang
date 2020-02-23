# Import

> ⚠️ All the information in this document is used for internal usage. May contain several inaccuracies, always read the related official documentation on the topic instead of trusting which is written here.

## C++

Declarations are included via `#include "..."` or via `#include <...>` and although these are not specified in the standard [(based on SO)](https://stackoverflow.com/a/3162067), the `"..."` syntax is usually a relative path search from the current file, so it is used for including project files, while `<...>` syntax is usually a search inside the include paths, so it is used for including external library files.

Implementations should be separately compiled and linked or separate build system (e.g. CMake) should be used.

Packages are should be already in the include path. Separate package manager (e.g. conan.io) can be used to make this process easier / be able to declare dependencies.

## C#

Generically speaking the ecosystem supports automatically importing all source files in the project (either by automatically listing all files in the `csproj` file in case of `.NET Framework` or [searching for them](https://docs.microsoft.com/en-us/dotnet/core/tools/csproj#default-compilation-includes-in-net-core-projects) in the directory structure in the case of `.NET Core`), but separate files only see members which are in the same namespace or in a namespace included by a `using` command.

*Note: OneLang currently does not support namespaces.*

External libraries should be added as references, after that their namespaces can be included as well.

C# supports including members using their fully qualified type names, so it works without any `using` statements.

The ecosystem's official package manager is **NuGet**.

## Go

Go can import packages, which are basically a bunch of source files together. Files in the package see any other member, but files outside of packages only see members with Uppercase casing.

Imports by default enclose every included member into a variable, e.g. if we use `import "fmt"` then we can use as `fmt.Printf()`. We can also alias imports with `import otherName "fmt"`, in this case it will be available as `otherName.Printf()`. We can also import all members without enclosing by using `import . "fmt"`, in this case we can simply use `Printf()`. This works as long as there are no conflicting imports defined.

Go can bundle multiple packages together into a module and modules can depend on other modules.

So packages seems to be similar to C# namespaces and modules seems to be similar to NuGet packages.

Internal packages must be put into the `internal` submodule, otherwise module users could use it by mistake and then it would be hard not to break semantic compatibility `>= v1`.

From the to-be-released Go version 1.14, there will be an official dependency system called `vgo` and packages will be hosted by Google: https://proxy.golang.org/

Currently the packages were downloaded directly e.g. Github.

## Java

Uses `packages` which are basically mirrors the directory structure,all files in the same directory are in a package, but a subdirectory is a separate package. One (public) class per file. You can `import` classes from packages (with `import packagename.ClassName`) or the whole package (with `import packagename.*`).

Classes from the same package see each other. You can use fully-qualified class names, so using `imports` is optional.

Namespace names are lowercase, class names are usually UpperCase.

There is no official package manager, but `Maven` [seems to be most common](https://snyk.io/blog/jvm-ecosystem-report-2018-tools/). It uses `pom.xml` to store dependency list, and Maven is seemingly downloading the packages from https://repo1.maven.org/maven2/, but other remote repositories can be added as well.

## JavaScript / TypeScript

We discuss ES6 modules with Node.js usage here.

Modules are `.js` (`.mjs`) files containing one or more explicitly exported members.

These can be imported one-by-one, e.g. `import { ClassName } from "module"` or using all members by enclosing them into a namespace, e.g. `import * as m from "module"`, in the latter case we can use as `m.ClassName`.

Relative imports (`from "./Util"`) are resolved relative to the current file, while absolute paths (`from "some-package-name"`) are resolved based on lib search path (also includes `node_modules/` folder).

Dependent libraries are referenced from `package.json`, and installed by `npm` (Node Package Manager) which is the official dependency manager. It stored on `npmjs.org` which is the official repository.

## PHP

By default PHP uses per-file including method, but PHP can also autoload based on class name.

It supports namespaces (`namespace NameSpace`), namespaces and classes can be included (`use NameSpace`, `use NameSpace\ClassName`) - otherwise the fully qualified type name should be used. Aliasing works (`use NameSpace\ClassName as OtherName`).

The dependency manager is `composer` and the package repository is `Packagist`.

Composer defines an autoload method which basically loads files based on mirroring the namespace structure into directory structure.

## Python

## Ruby

## Swift