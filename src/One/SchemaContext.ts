import { SchemaTransformHandler } from "./SchemaTransformHandler";
import { OneAst as one } from "./Ast";

export class SchemaContext {
    transformHandler: SchemaTransformHandler;

    constructor(public schema: one.Schema) {
        this.transformHandler = SchemaTransformHandler.instance;
    }

    ensureTransformed(...transformNames: string[]) {
        this.transformHandler.ensure(this.schema, ...transformNames);
    }
}