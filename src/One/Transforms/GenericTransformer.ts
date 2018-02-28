import { OneAst as one } from "../Ast";
import { AstVisitor } from "../AstVisitor";
import { ISchemaTransform } from "../SchemaTransformer";
import { SchemaContext } from "../SchemaContext";
import { OverviewGenerator } from "../OverviewGenerator";
import { AstHelper } from "../AstHelper";
import { LangFileSchema } from "../../Generator/LangFileSchema";

export interface GenericTransformerFile {
    transforms: {
        input: any;
        output: any;
        description?: string;
        langs?: string[];
    }[];
}

class VariableContext {
    variables: { [name: string]: any } = {};
}

class TransformPropInfo {
    type: "matchObject"|"matchValue"|"saveVar";
    matchValue: any;
    matchObject: TransformObjectInfo;
    saveVarName: string;

    constructor(public propertyName: string, propValue: any) {
        if (typeof propValue === "string" && propValue.startsWith("$")) {
            this.type = "saveVar";
            this.saveVarName = propValue.substr(1);
        } else if (typeof propValue === "object") {
            this.type = "matchObject";
            this.matchObject = new TransformObjectInfo(propValue);
        } else {
            this.type = "matchValue";
            this.matchValue = propValue;
        }
    }

    execute(varCtx: VariableContext, value: any) {
        if (this.type === "saveVar") {
            varCtx.variables[this.saveVarName] = value;
            return true;
        } else if (this.type === "matchValue") {
            return this.matchValue === value;
        } else if (this.type === "matchObject") {
            return this.matchObject.execute(varCtx, value);
        }
    }
}

class TransformObjectInfo {
    properties: TransformPropInfo[];

    constructor(source: any) {
        this.properties = Object.keys(source).map(x => new TransformPropInfo(x, source[x]));
    }

    execute(varCtx: VariableContext, value: any) {
        for (const prop of this.properties)
            if (!prop.execute(varCtx, value[prop.propertyName]))
                return false;
        return true;
    }
}

class ValueSetter {
    type: "literal"|"array"|"object"|"variable";
    arrayItems: ValueSetter[];

    constructor(value: any) {
    }
}

class GenericTransform {
    input: TransformObjectInfo;

    constructor(input: any, public output: any, public langs?: string[]) {
        this.input = new TransformObjectInfo(input);
        this.output = output;
    }

    objectGenerator(template: any, varCtx: VariableContext) {
        if (Array.isArray(template)) {
            return template.map(x => this.objectGenerator(x, varCtx));
        } else if (typeof template === "string" && template.startsWith("$")) {
            return varCtx.variables[template.substr(1)];
        } else if (typeof template === "object") {
            const result = {};
            for (const propName of Object.keys(template))
                result[propName] = this.objectGenerator(template[propName], varCtx);
            return result;
        } else {
            return template;
        }
    }

    execute(obj: any) {
        const varCtx = new VariableContext();
        const match = this.input.execute(varCtx, obj);
        if (match) {
            const newObj = this.objectGenerator(this.output, varCtx);
            AstHelper.replaceProperties(obj, newObj);
        }
        return match;
    }
}

export class GenericTransformer extends AstVisitor<void> {
    transforms: GenericTransform[];
    langTransforms: GenericTransform[];

    constructor(file: GenericTransformerFile) {
        super();
        this.transforms = file.transforms.map(x => new GenericTransform(x.input, x.output, x.langs));
    }

    protected visitStatement(statement: one.Statement) {
        for (const transform of this.langTransforms)
            if (transform.execute(statement))
                break;

        super.visitStatement(statement, null);
    }

    protected visitExpression(expression: one.Expression) {
        for (const transform of this.langTransforms)
            if (transform.execute(expression))
                break;

        super.visitExpression(expression, null);
    }

    process(schema: one.Schema) {
        this.langTransforms = this.transforms.filter(x => !x.langs || x.langs.includes(schema.langData.langId));
        this.visitSchema(schema, null);
    }
}
