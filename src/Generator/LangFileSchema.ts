export namespace LangFileSchema {
    export interface FunctionArgument {
        name: string;
    }

    export enum Casing {
        PascalCase = "pascal_case",
        CamelCase = "camel_case",
        SnakeCase = "snake_case",
    }

    export interface CasingOptions {
        class?: Casing;
        method?: Casing;
        field?: Casing;
        property?: Casing;
        enum?: Casing;
        variable?: Casing;
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

    export interface Operator {
        template: string;
        leftType?: string;
        rightType?: string;
        operator?: string;
    }

    export interface Method {
        extraArgs: string[];
        includes: string[];
        template: string;
        mutates?: boolean;
    }

    export interface Field {
        template: string;
    }

    export interface Class {
        type: string;
        includes: string[];
        fields: { [name: string]: Field };
        methods: { [name: string]: Method };
    }

    export interface LangFile {
        classes: { [name: string]: Class };
        operators: { [name: string]: Operator };
        extension: string;
        casing: CasingOptions;
        primitiveTypes: {
            void: string;
            boolean: string;
            string: string;
            number: string;
            any: string;
        };
        templates: Templates;
        includes: string[];
        expressions: string;
    }
}
