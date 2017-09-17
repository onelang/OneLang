import { OneAst as one } from "./Ast";

export interface ISchemaTransformer {
    name: string;
    transform(schema: one.Schema);
    revert?(schema: one.Schema);
}

export class SchemaTransformHandler {
    static instance = new SchemaTransformHandler();

    transformers: { [name: string]: ISchemaTransformer } = {};

    constructor() { }

    log(data: string) {
        console.log(`[SchemaTransformHandler] ${data}`);
    }

    addTransformer(trans: ISchemaTransformer) {
        this.transformers[trans.name] = trans;
    }

    ensure(schema: one.Schema, ...transformNames: string[]) {
        if (!schema.meta) schema.meta = {};
        if (!schema.meta.transforms) schema.meta.transforms = {};

        for (const transformName of transformNames) {
            if(schema.meta.transforms[transformName]) continue;
            
            const transformer = this.transformers[transformName];
            if (!transformer)
                this.log(`Transformer "${transformName}" not found!`);
            transformer.transform(schema);
            schema.meta.transforms[transformName] = true;
        }
    }
}