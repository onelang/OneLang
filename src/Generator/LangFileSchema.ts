export namespace LangFileSchema {
    export interface FunctionArgument {
        name: string;
    }

    export interface Function {
        arguments: FunctionArgument[];
        includes: string[];
        template: string;
    }

    export enum Casing {
        PascalCase = "pascal_case",
        CamelCase = "camel_case",
        SnakeCase = "snake_case",
    }

    export interface CasingOptions {
        class?: Casing;
        method?: Casing;
    }

    export interface TemplateObj {
        args: FunctionArgument[];
        template: string;
    }

    export interface Templates {
        testGenerator: string;
        main: string;
        [name: string]: string|TemplateObj;
    }

    export interface LangFile {
        functions: { [name: string]: Function };
        extension: string;
        casing: CasingOptions;
        primitiveTypes: {
            void: string;
            boolean: string;
            string: string;
            number: string;
            any: string;
        };
        array: string;
        templates: Templates;
        expressions: string;
    }
}
