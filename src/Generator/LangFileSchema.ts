import { TemplateMethod } from "./OneTemplate/TemplateGenerator";

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
        generator?: TemplateMethod;
    }

    export interface Method extends TemplateObj {
        extraArgs?: string[];
        mutates?: boolean;
        throws?: boolean;
    }

    export interface Field extends TemplateObj {
    }

    export interface Operator extends TemplateObj {
    }

    export interface Class extends TemplateObj {
        type: string;
        fields: { [name: string]: Field };
        methods: { [name: string]: Method };
    }

    export interface LangFile {
        name: string;
        extension: string;
        main?: string;
        mainFilename: string;
        classes: { [name: string]: Class };
        operators: { [name: string]: Operator };
        casing: CasingOptions;
        primitiveTypes: {
            void?: string;
            boolean?: string;
            string?: string;
            number?: string;
            any?: string;
        };
        genericsOverride?: string;
        templates: { [name: string]: TemplateObj; };
        includes: string[];
        includeSources: { [name: string]: string };
        expressions: { [name: string]: TemplateObj };
    }
}
