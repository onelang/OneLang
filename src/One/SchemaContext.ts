import { SchemaTransformer } from "./SchemaTransformer";
import { OneAst as one } from "./Ast";

export class SchemaContext {
    transformer: SchemaTransformer;

    constructor(public schema: one.Schema) {
        this.transformer = SchemaTransformer.instance;
    }

    ensureTransforms(...transformNames: string[]) {
        this.transformer.ensure(this.schema, ...transformNames);
    }
}