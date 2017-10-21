import { SchemaTransformer } from "./SchemaTransformer";
import { OneAst as one } from "./Ast";
import { Context as TiContext } from "./Transforms/ResolveIdentifiersTransform";
import { LangFileSchema } from "../Generator/LangFileSchema";

export class SchemaContext {
    arrayType: string;
    mapType: string;
    transformer: SchemaTransformer;
    tiContext = new TiContext();

    constructor(public schema: one.Schema, public schemaType: "program"|"overlay"|"stdlib") {
        this.transformer = SchemaTransformer.instance;
    }

    ensureTransforms(...transformNames: string[]) {
        this.transformer.ensure(this, ...transformNames);
    }

    addDependencySchema(schemaCtx: SchemaContext) {
        if (!["overlay", "stdlib"].includes(schemaCtx.schemaType))
            throw new Error("Only overlay and stdlib schemas are allowed as dependencies!");

        for (const glob of Object.values(schemaCtx.schema.globals))
            this.tiContext.addLocalVar(glob);
        
        for (const cls of Object.values(schemaCtx.schema.classes)) {
            cls.meta = cls.meta || {};
            cls.meta[schemaCtx.schemaType] = true; // TODO: move this logic to somewhere else?
            this.tiContext.classes.addClass(cls);
        }
    }

    getClass(name: string): one.Class {
        return this.schema.classes[name] || this.tiContext.classes.classes[name];
    }
}