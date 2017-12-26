export namespace LangFileSchema {
    export interface FunctionArgument {
        name: string;
    }

    export enum Casing {
        PascalCase = "pascal_case",
        CamelCase = "camel_case",
        SnakeCase = "snake_case",
        UpperCase = "upper_case",
    }

    export interface CasingOptions {
        class?: Casing;
        method?: Casing;
        field?: Casing;
        property?: Casing;
        enum?: Casing;
        enumMember?: Casing;
        variable?: Casing;
    }

    export interface TemplateObj {
        args: FunctionArgument[];
        includes: string[];
        template: string;
    }

    export interface Templates {
        testGenerator: string;
        main: string;
        [name: string]: string|TemplateObj;
    }

    export interface Operator {
        includes?: string[];
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
        throws?: boolean;
    }

    export interface Field {
        template: string;
    }

    export interface Class {
        type: string;
        template: string;
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
        expressions: { [name: string]: string|TemplateObj };
    }
}
