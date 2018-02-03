import { OneAst as one } from "./One/Ast";
import { TypeScriptParser2 } from "./Parsers/TypeScriptParser2";
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
import { FillThrowsTransform } from "./One/Transforms/FillThrowsTransform";
import { RemoveEmptyTemplateStringLiterals } from "./One/Transforms/RemoveEmptyTemplateStringLiterals";
import { FixGenericAndEnumTypes } from "./One/Transforms/FixGenericAndEnumTypes";
import { IParser } from "./Parsers/Common/IParser";
import { CSharpParser } from "./Parsers/CSharpParser";
import { RubyParser } from "./Parsers/RubyParser";
import { ExtractCommentAttributes } from "./One/Transforms/ExtractCommentAttributes";

declare var YAML: any;

SchemaTransformer.instance.addTransform(new FillNameTransform());
SchemaTransformer.instance.addTransform(new FillParentTransform());
SchemaTransformer.instance.addTransform(new FillMetaPathTransform());
SchemaTransformer.instance.addTransform(new InlineOverlayTypesTransform());
SchemaTransformer.instance.addTransform(new ConvertInlineThisRefTransform());
SchemaTransformer.instance.addTransform(new TriviaCommentTransform());
SchemaTransformer.instance.addTransform(new InferCharacterTypes());

export class OneCompiler {
    parser: IParser;
    schemaCtx: SchemaContext;
    overlayCtx: SchemaContext;
    stdlibCtx: SchemaContext;
    genericTransformer: GenericTransformer;
    langName: string;

    saveSchemaStateCallback: (type: "overviewText"|"schemaJson", schemaType: "program"|"overlay"|"stdlib", name: string, data: string) => void;

    /**
     * Schema types:
     *  - program: the input program to be compiled into another language
     *  - overlay: helper classes which map the input language's built-in methods / properties to OneLang methods (eg. Object.keys(map) -> map.keys())
     *  - stdlib: declaration (not implementation!) of OneLang methods (eg. map.keys) which are implemented in every language separately
     */
    parse(langName: string, programCode: string, overlayCode: string, stdlibCode: string, genericTransformerYaml: string) {
        this.langName = langName;
        let arrayName: string;
        if (langName === "typescript") {
            overlayCode = overlayCode.replace(/^[^\n]*<reference.*stdlib.d.ts[^\n]*\n/, "");
            this.parser = new TypeScriptParser2(programCode);
        } else if (langName === "csharp") {
            this.parser = new CSharpParser(programCode);
        } else if (langName === "ruby") {
            this.parser = new RubyParser(programCode);
        } else {
            throw new Error(`[OneCompiler] Unsupported language: ${langName}`);
        }

        const schema = this.parser.parse();
        const overlaySchema = TypeScriptParser2.parseFile(overlayCode);
        const stdlibSchema = TypeScriptParser2.parseFile(stdlibCode);
        this.genericTransformer = new GenericTransformer(<GenericTransformerFile>
            YAML.parse(genericTransformerYaml));

        // TODO: hack
        overlaySchema.classes[this.parser.langData.literalClassNames.array].meta = { iterable: true };
        stdlibSchema.classes["OneArray"].meta = { iterable: true };
        stdlibSchema.classes["OneError"].methods["raise"].throws = true;
        
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
        new FixGenericAndEnumTypes().process(this.stdlibCtx.schema);
        this.saveSchemaState(this.stdlibCtx, "0_Original");

        this.stdlibCtx.ensureTransforms("fillName", "fillMetaPath", "fillParent");
        ResolveIdentifiersTransform.transform(this.stdlibCtx);
        new InferTypesTransform(this.stdlibCtx).transform();
        this.saveSchemaState(this.stdlibCtx, "0_Converted");
        
        this.overlayCtx = new SchemaContext(overlaySchema, "overlay");
        this.overlayCtx.addDependencySchema(this.stdlibCtx);
        new FixGenericAndEnumTypes().process(this.overlayCtx.schema);
        this.saveSchemaState(this.overlayCtx, "0_Original");

        this.overlayCtx.ensureTransforms("fillName", "fillMetaPath", "fillParent");
        ResolveIdentifiersTransform.transform(this.overlayCtx);
        new InferTypesTransform(this.overlayCtx).transform();
        this.overlayCtx.ensureTransforms("convertInlineThisRef");
        this.saveSchemaState(this.overlayCtx, "1_Converted");
        
        this.schemaCtx = new SchemaContext(schema, "program");
        // TODO: move to somewhere else...
        this.schemaCtx.arrayType = this.parser.langData.literalClassNames.array;
        this.schemaCtx.mapType = this.parser.langData.literalClassNames.map;

        new RemoveEmptyTemplateStringLiterals().process(this.schemaCtx.schema);
        new FixGenericAndEnumTypes().process(this.schemaCtx.schema);
        new ExtractCommentAttributes().process(this.schemaCtx.schema);
        this.saveSchemaState(this.schemaCtx, `0_Original`);
        
        this.genericTransformer.process(this.schemaCtx.schema);
        this.saveSchemaState(this.schemaCtx, `1_GenericTransforms`);
        
        this.schemaCtx.addDependencySchema(this.overlayCtx);
        this.schemaCtx.addDependencySchema(this.stdlibCtx);
        this.schemaCtx.ensureTransforms("fillName", "fillMetaPath", "fillParent");
        ResolveIdentifiersTransform.transform(this.schemaCtx);
        new InferTypesTransform(this.schemaCtx).transform();
        this.saveSchemaState(this.schemaCtx, `2_TypesInferred`);
        
        this.schemaCtx.ensureTransforms("inlineOverlayTypes");
        this.saveSchemaState(this.schemaCtx, `3_OverlayTypesInlined`);

        this.schemaCtx.ensureTransforms("triviaComment");
        this.saveSchemaState(this.schemaCtx, `4_ExtendedInfoAdded`);

        this.schemaCtx.arrayType = "OneArray";
        this.schemaCtx.mapType = "OneMap";

        global["debugOn"] = true;
        new InferTypesTransform(this.schemaCtx).transform();
        this.schemaCtx.ensureTransforms("inferCharacterTypes");
        this.saveSchemaState(this.schemaCtx, `5_TypesInferredAgain`);
    }

    preprocessLangFile(lang: LangFileSchema.LangFile) {
        for (const opDesc of Object.keys(lang.operators||{})) {
            let opData = lang.operators[opDesc];
            if (typeof opData === "string")
                opData = lang.operators[opDesc] = { template: <string><any>opData };
            const opDescParts = opDesc.split(" ").filter(x => x !== "");
            if (opDescParts.length === 3)
                [opData.leftType, opData.operator, opData.rightType] = opDescParts;
        }
    }

    getCodeGenerator(langCode: string, langName?: string) {
        const lang = <LangFileSchema.LangFile> YAML.parse(langCode);
        lang.name = langName;

        this.preprocessLangFile(lang);
        new SchemaCaseConverter(lang.casing).process(this.schemaCtx.schema);
        new SchemaCaseConverter(lang.casing).process(this.stdlibCtx.schema);
        new FillVariableMutability(lang).process(this.schemaCtx.schema);
        new FillThrowsTransform(lang).process(this.schemaCtx.schema);
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