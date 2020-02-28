import { TemplateMethod } from "./OneTemplate/TemplateGenerator";

export class FunctionArgument {
    name: string;
}

export enum Casing { PascalCase, CamelCase, SnakeCase, UpperCase }

export class CasingOptions {
    class: Casing;
    method: Casing;
    field: Casing;
    property: Casing;
    enum: Casing;
    enumMember: Casing;
    variable: Casing;
}

export class TemplateObj {
    args: FunctionArgument[];
    includes: string[];
    template: string;
    generator: TemplateMethod;
}

export class Method extends TemplateObj {
    extraArgs: string[];
    mutates: boolean;
    throws: boolean;
}

export class Field extends TemplateObj {
}

export class Operator extends TemplateObj {
}

export class Class extends TemplateObj {
    type: string;
    fields: { [name: string]: Field };
    methods: { [name: string]: Method };
}

export class PrimitiveTypeNames {
    void: string;
    boolean: string;
    string: string;
    number: string;
    any: string;
}

export class LangFile {
    name: string;
    extension: string;
    main: string;
    mainFilename: string;
    classes: { [name: string]: Class };
    operators: { [name: string]: Operator };
    casing: CasingOptions;
    primitiveTypes: PrimitiveTypeNames;
    genericsOverride: string;
    templates: { [name: string]: TemplateObj };
    includes: string[];
    includeSources: { [name: string]: string };
    expressions: { [name: string]: TemplateObj };
}
