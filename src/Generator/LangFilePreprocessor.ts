import { TemplateMethod } from "./OneTemplate/TemplateGenerator";
import { SourceFile } from "../One/Ast/Types";
import { LangFile, TemplateObj, FunctionArgument } from "./LangFileSchema";

export class LangFilePreprocessor {
    static preprocess(schema: LangFile, stdlib: SourceFile): void {
        this.stabilizeStructure(schema);
        this.compileTemplates(schema, stdlib);
    }

    static stabilizeStructure(lang: LangFile): void {
        if (!lang.operators) lang.operators = {};
        if (!lang.classes) lang.classes = {};
        if (!lang.includeSources) lang.includeSources = {};
        if (!lang.primitiveTypes) lang.primitiveTypes = <any>{};
        if (!lang.expressions) lang.expressions = {};
        if (!lang.casing) lang.casing = <any>{};
        if (!lang.templates) lang.templates = {};
        if (!lang.includes) lang.includes = [];

        this.objectifyTemplateMap(lang.operators);
        this.objectifyTemplateMap(lang.classes);
        this.objectifyTemplateMap(lang.templates);
        this.objectifyTemplateMap(lang.expressions);

        for (const cls of Object.values(lang.classes)) {
            if (!cls.methods) cls.methods = {};
            if (!cls.fields) cls.fields = {};
            if (!cls.includes) cls.includes = [];

            this.objectifyTemplateMap(cls.fields);
            this.objectifyTemplateMap(cls.methods);

            for (const method of Object.values(cls.methods)) {
                if (!method.includes) method.includes = [];
                if (!method.extraArgs) method.extraArgs = [];
            }
        }

        for (const op of Object.values(lang.operators))
            if (!op.includes) op.includes = [];
    }

    static objectifyTemplateMap(map: { [name: string]: TemplateObj }): void {
        for (const name of Object.keys(map)) {
            if (typeof map[name] === "string")
                map[name] = <any>{ template: <string><any>map[name], args: <any>[], includes: <any>[] };

            if (!map[name].args)
                map[name].args = [];

            //const args = map[name].args;
            //for (const argName of Object.keys(args))
            //    if (typeof args[argName] === "string")
            //        args[argName] = { name: args[argName] };
        }
    }

    static compileTemplates(lang: LangFile, stdlib: SourceFile): void {
        for (const name of Object.keys(lang.expressions))
            lang.expressions[name].generator = new TemplateMethod(name, ["expr"], lang.expressions[name].template);

        for (const name of Object.keys(lang.operators))
            lang.operators[name].generator = new TemplateMethod(name, ["left", "right"], lang.operators[name].template);

        for (const name of Object.keys(lang.templates)) {
            if (name === "testGenerator") 
                lang.templates[name].args = ["class", "method", "methodInfo"].map(x => new FunctionArgument(x));
            
            lang.templates[name].generator = new TemplateMethod(name, lang.templates[name].args.map(x => x.name), lang.templates[name].template);
        }

        for (const clsName of Object.keys(lang.classes)) {
            const cls = lang.classes[clsName];
            cls.generator = new TemplateMethod("typeGenerator", ["typeArgs", "typeArguments"], cls.type || clsName);

            for (const methodName of Object.keys(cls.methods)) {
                const method = cls.methods[methodName]; 
                const stdMethod = stdlib.classes.find(x => x.name === clsName).methods.find(x => x.name === methodName); 
                const methodArgs = stdMethod ? stdMethod.parameters.map(x => x.name) : []; 
                const funcArgs = ["self", "typeArgs"];
                for (const item of methodArgs)
                    funcArgs.push(item);
                for (const item of method.extraArgs)
                    funcArgs.push(item);
                method.generator = new TemplateMethod(methodName, funcArgs, method.template);
            }

            for (const name of Object.keys(cls.fields))
                cls.fields[name].generator = new TemplateMethod(name, ["self", "typeArgs"], cls.fields[name].template); 
        }
    }
}