import { OneAst as one } from "./Ast";

export interface ISchemaTransform {
    name: string;
    dependencies?: string[];
    transform(schema: one.Schema);
    revert?(schema: one.Schema);
}

export class SchemaTransformer {
    static instance = new SchemaTransformer();

    transformers: { [name: string]: ISchemaTransform } = {};

    constructor() { }

    log(data: string) {
        console.log(`[SchemaTransformHandler] ${data}`);
    }

    addTransform(trans: ISchemaTransform) {
        this.transformers[trans.name] = trans;
    }

    ensure(schema: one.Schema, ...transformNames: string[]) {
        if (!schema.meta) schema.meta = {};
        if (!schema.meta.transforms) schema.meta.transforms = {};

        for (const transformName of transformNames) {
            if(schema.meta.transforms[transformName]) continue;
            
            const transformer = this.transformers[transformName];
            if (!transformer) {
                this.log(`Transformer "${transformName}" not found!`);
                continue;
            }

            if (transformer.dependencies)
                this.ensure(schema, ...transformer.dependencies);

            transformer.transform(schema);
            schema.meta.transforms[transformName] = true;
        }
    }
}