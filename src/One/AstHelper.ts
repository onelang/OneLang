import { OneAst as one } from "./Ast";

export class AstHelper {
    static fillNames(schema: one.Schema) {
        for (const enumName of Object.keys(schema.enums))
            schema.enums[enumName].name = enumName;

        for (const className of Object.keys(schema.classes)) {
            const cls = schema.classes[className];
            cls.name = className;

            for (const methodName of Object.keys(cls.methods))
                cls.methods[methodName].name = methodName;
        }
    }
}
