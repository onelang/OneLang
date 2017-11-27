import { OneAst as one } from "./One/Ast";
import { TypeScriptParser } from "./Parsers/TypeScriptParser";
import { SchemaTransformer } from "./One/SchemaTransformer";
import { FillNameTransform } from "./One/Transforms/FillNameTransform";
import { FillParentTransform } from "./One/Transforms/FillParentTransform";
import { FillMetaPathTransform } from "./One/Transforms/FillMetaPathTransform";
import { ResolveIdentifiersTransform } from "./One/Transforms/ResolveIdentifiersTransform";
import { InferTypesTransform } from "./One/Transforms/InferTypesTransform";
import { InlineOverlayTypesTransform } from "./One/Transforms/InlineOverlayTypesTransform";
import { ConvertInlineThisRefTransform } from "./One/Transforms/ConvertInlineThisRefTransform";
import { InferCharacterTypes } from "./One/Transforms/InferCharacterTypes";
import { SchemaContext } from "./One/SchemaContext";
import { OverviewGenerator } from "./One/OverviewGenerator";
import { AstHelper } from "./One/AstHelper";
import { SchemaCaseConverter } from "./One/Transforms/CaseConverter";
import { LangFileSchema } from "./Generator/LangFileSchema";
import { CodeGenerator } from "./Generator/CodeGenerator";
import { FillVariableMutability } from "./One/Transforms/FillVariableMutability";
import { TriviaCommentTransform } from "./One/Transforms/TriviaCommentTransform";
import { GenericTransformer, GenericTransformerFile } from "./One/Transforms/GenericTransformer";
import { IncludesCollector } from "./One/Transforms/IncludesCollector";

declare var YAML: any;

SchemaTransformer.instance.addTransform(new FillNameTransform());
SchemaTransformer.instance.addTransform(new FillParentTransform());
SchemaTransformer.instance.addTransform(new FillMetaPathTransform());
SchemaTransformer.instance.addTransform(new ResolveIdentifiersTransform());
SchemaTransformer.instance.addTransform(new InferTypesTransform());
SchemaTransformer.instance.addTransform(new InlineOverlayTypesTransform());
SchemaTransformer.instance.addTransform(new ConvertInlineThisRefTransform());
SchemaTransformer.instance.addTransform(new TriviaCommentTransform());
SchemaTransformer.instance.addTransform(new InferCharacterTypes());

export class OneCompiler {
    schemaCtx: SchemaContext;
    overlayCtx: SchemaContext;
    stdlibCtx: SchemaContext;
    genericTransformer: GenericTransformer;

    saveSchemaStateCallback: (type: "overviewText"|"schemaJson", schemaType: "program"|"overlay"|"stdlib", name: string, data: string) => void;

    parseFromTS(programCode: string, overlayCode: string, stdlibCode: string, genericTransformerYaml: string) {
        overlayCode = overlayCode.replace(/^[^\n]*<reference.*stdlib.d.ts[^\n]*\n/, "");
        const schema = TypeScriptParser.parseFile(programCode.replace(/\r\n/g, "\n"));
        const overlaySchema = TypeScriptParser.parseFile(overlayCode.replace(/\r\n/g, "\n"));
        const stdlibSchema = TypeScriptParser.parseFile(stdlibCode.replace(/\r\n/g, "\n"));
        this.genericTransformer = new GenericTransformer(<GenericTransformerFile>
            YAML.parse(genericTransformerYaml));

        // TODO: hack
        overlaySchema.classes["TsArray"].meta = { iterable: true };
        stdlibSchema.classes["OneArray"].meta = { iterable: true };
        
        this.prepareSchemas(schema, overlaySchema, stdlibSchema);
    }

    protected saveSchemaState(schemaCtx: SchemaContext, name: string) {
        if (!this.saveSchemaStateCallback) return;

        const schemaOverview = new OverviewGenerator().generate(schemaCtx);
        this.saveSchemaStateCallback("overviewText", schemaCtx.schema.sourceType, name, schemaOverview);

        const schemaJson = AstHelper.toJson(schemaCtx.schema);
        this.saveSchemaStateCallback("schemaJson", schemaCtx.schema.sourceType, name, schemaJson);
    }

    protected prepareSchemas(schema: one.Schema, overlaySchema: one.Schema, stdlibSchema: one.Schema) {
        schema.sourceType = "program";
        overlaySchema.sourceType = "overlay";
        stdlibSchema.sourceType = "stdlib";

        this.stdlibCtx = new SchemaContext(stdlibSchema, "stdlib");
        this.saveSchemaState(this.stdlibCtx, "0_Original");

        this.stdlibCtx.ensureTransforms("fillMetaPath", "inferTypes");
        this.saveSchemaState(this.stdlibCtx, "0_Converted");
        
        this.overlayCtx = new SchemaContext(overlaySchema, "overlay");
        this.overlayCtx.addDependencySchema(this.stdlibCtx);
        this.saveSchemaState(this.overlayCtx, "0_Original");

        this.overlayCtx.ensureTransforms("convertInlineThisRef", "fillMetaPath");
        this.saveSchemaState(this.overlayCtx, "1_Converted");
        
        this.schemaCtx = new SchemaContext(schema, "program");
        // TODO: move to somewhere else...
        this.schemaCtx.arrayType = "TsArray";
        this.schemaCtx.mapType = "TsMap";
        this.saveSchemaState(this.schemaCtx, `0_Original`);
        
        this.genericTransformer.process(this.schemaCtx.schema);
        this.saveSchemaState(this.schemaCtx, `1_GenericTransforms`);
        
        this.schemaCtx.addDependencySchema(this.overlayCtx);
        this.schemaCtx.addDependencySchema(this.stdlibCtx);
        this.schemaCtx.ensureTransforms("inferTypes");
        this.saveSchemaState(this.schemaCtx, `2_TypesInferred`);
        
        this.schemaCtx.ensureTransforms("inlineOverlayTypes");
        this.saveSchemaState(this.schemaCtx, `3_OverlayTypesInlined`);

        this.schemaCtx.ensureTransforms("triviaComment");
        this.saveSchemaState(this.schemaCtx, `4_ExtendedInfoAdded`);

        // TODO: looks like as a giantic hack...
        this.schemaCtx.schema.meta.transforms["inferTypes"] = false;
        this.schemaCtx.arrayType = "OneArray";
        this.schemaCtx.mapType = "OneMap";

        global["debugOn"] = true;
        this.schemaCtx.ensureTransforms("inferTypes", "inferCharacterTypes");
        this.saveSchemaState(this.schemaCtx, `5_TypesInferredAgain`);
    }

    preprocessLangFile(lang: LangFileSchema.LangFile) {
        for (const opDesc of Object.keys(lang.operators||{})) {
            const opData = lang.operators[opDesc];
            const opDescParts = opDesc.split(" ").filter(x => x !== "");
            if (opDescParts.length === 3)
                [opData.leftType, opData.operator, opData.rightType] = opDescParts;
        }
    }

    getCodeGenerator(langCode: string, langName?: string) {
        const lang = <LangFileSchema.LangFile> YAML.parse(langCode.replace(/\\ /g, "{space}"));

        this.preprocessLangFile(lang);
        new SchemaCaseConverter(lang.casing).process(this.schemaCtx.schema);
        new FillVariableMutability(lang).process(this.schemaCtx.schema);
        this.saveSchemaState(this.schemaCtx, `10_${langName ? `${langName}_` : ""}Init`);
        
        const codeGen = new CodeGenerator(this.schemaCtx.schema, this.stdlibCtx.schema, lang);
        return codeGen;
    }

    compile(langCode: string, langName?: string, callTestMethod = true) {
        const codeGen = this.getCodeGenerator(langCode, langName);
        const generatedCode = codeGen.generate(callTestMethod);
        return generatedCode;
    }
}