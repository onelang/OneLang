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
import { PhpParser } from "./Parsers/PhpParser";
import { ForceTemplateStrings } from "./One/Transforms/ForceTemplateStrings";
import { WhileToForTransform } from "./One/Transforms/WhileToFor";
import { ProcessTypeHints } from "./One/Transforms/ProcessTypeHints";
import { LangFilePreprocessor } from "./Generator/LangFilePreprocessor";
import { PackageManager } from "./StdLib/PackageManager";
import * as YAML from "js-yaml";

SchemaTransformer.instance.addTransform(new FillNameTransform());
SchemaTransformer.instance.addTransform(new FillParentTransform());
SchemaTransformer.instance.addTransform(new FillMetaPathTransform());
SchemaTransformer.instance.addTransform(new InlineOverlayTypesTransform());
SchemaTransformer.instance.addTransform(new ConvertInlineThisRefTransform());
SchemaTransformer.instance.addTransform(new TriviaCommentTransform());
SchemaTransformer.instance.addTransform(new InferCharacterTypes());

export class OneCompiler {
    schemaCtx: SchemaContext;
    overlayCtx: SchemaContext;
    stdlibCtx: SchemaContext;
    additionalSchemas: SchemaContext[];
    genericTransformer: GenericTransformer;

    saveSchemaStateCallback: (type: "overviewText"|"schemaJson", schemaType: "program"|"overlay"|"stdlib", name: string, generator: () => string) => void;

    setupWithSource(overlayCode: string, stdlibCode: string, genericTransformerYaml: string) {
        const overlaySchema = TypeScriptParser2.parseFile(overlayCode);
        const stdlibSchema = TypeScriptParser2.parseFile(stdlibCode);
        const genericTransformer = new GenericTransformer(<GenericTransformerFile> YAML.safeLoad(genericTransformerYaml));
        this.setup(overlaySchema, stdlibSchema, genericTransformer);
    }

    setup(overlaySchema: one.Schema, stdlibSchema: one.Schema, genericTransformer: GenericTransformer) {
        overlaySchema.sourceType = "overlay";
        stdlibSchema.sourceType = "stdlib";
        this.genericTransformer = genericTransformer;

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

        // TODO: hack
        //this.overlayCtx.schema.classes[this.schemaCtx.arrayType].meta = { iterable: true };
        this.stdlibCtx.schema.classes["OneArray"].meta = { iterable: true };
        this.stdlibCtx.schema.classes["OneError"].methods["raise"].throws = true;
    }

    static parseSchema(langName: string, programCode: string, schemaType: "program"|"overlay"|"stdlib" = "program"): SchemaContext {
        let parser: IParser;
        if (langName === "typescript") {
            parser = new TypeScriptParser2(programCode);
        } else if (langName === "csharp") {
            parser = new CSharpParser(programCode);
        } else if (langName === "ruby") {
            parser = new RubyParser(programCode);
        } else if (langName === "php") {
            parser = new PhpParser(programCode);
        } else {
            throw new Error(`[OneCompiler] Unsupported language: ${langName}`);
        }

        const schema = parser.parse();
        schema.sourceType = schemaType;

        const schemaCtx = new SchemaContext(schema, schemaType);
        schemaCtx.arrayType = parser.langData.literalClassNames.array;
        schemaCtx.mapType = parser.langData.literalClassNames.map;
        return schemaCtx;
    }

    processSchema() {
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

        new InferTypesTransform(this.schemaCtx).transform();
        this.schemaCtx.ensureTransforms("inferCharacterTypes");
        this.saveSchemaState(this.schemaCtx, `5_TypesInferredAgain`);

        if (!this.schemaCtx.schema.langData.supportsTemplateStrings)
            new ForceTemplateStrings().transform(this.schemaCtx);

        if (!this.schemaCtx.schema.langData.supportsFor)
            new WhileToForTransform().transform(this.schemaCtx);

        new ProcessTypeHints().transform(this.schemaCtx);

        this.saveSchemaState(this.schemaCtx, `6_PostProcess`);
    }

    /**
     * Schema types:
     *  - program: the input program to be compiled into another language
     *  - overlay: helper classes which map the input language's built-in methods / properties to OneLang methods (eg. Object.keys(map) -> map.keys())
     *  - stdlib: declaration (not implementation!) of OneLang methods (eg. map.keys) which are implemented in every language separately
     */
    parse(langName: string, programCode: string) {
        this.schemaCtx = OneCompiler.parseSchema(langName, programCode);
        this.processSchema();
    }

    protected saveSchemaState(schemaCtx: SchemaContext, name: string) {
        if (!this.saveSchemaStateCallback) return;

        this.saveSchemaStateCallback("overviewText", schemaCtx.schema.sourceType, name, () => new OverviewGenerator().generate(schemaCtx));
        this.saveSchemaStateCallback("schemaJson", schemaCtx.schema.sourceType, name, () => AstHelper.toJson(schemaCtx.schema));
    }

    static setupLangSchema(langSchema: LangFileSchema.LangFile, pacMan: PackageManager, stdlib: one.Schema) {
        pacMan.loadImplsIntoLangFile(langSchema);
        LangFilePreprocessor.preprocess(langSchema, stdlib);
    }

    getCodeGenerator(lang: LangFileSchema.LangFile) {
        new SchemaCaseConverter(lang.casing).process(this.schemaCtx.schema);
        new SchemaCaseConverter(lang.casing).process(this.stdlibCtx.schema);
        new FillVariableMutability(lang).process(this.schemaCtx.schema);
        new FillThrowsTransform(lang).process(this.schemaCtx.schema);
        this.saveSchemaState(this.schemaCtx, `10_${lang.name ? `${lang.name}_` : ""}Init`);
        
        const codeGen = new CodeGenerator(this.schemaCtx.schema, this.stdlibCtx.schema, lang);
        return codeGen;
    }

    compile(langSchema: LangFileSchema.LangFile, pacMan: PackageManager, callTestMethod = true, genMeta = false) {
        OneCompiler.setupLangSchema(langSchema, pacMan, this.stdlibCtx.schema);
        const codeGen = this.getCodeGenerator(langSchema);
        codeGen.model.config.genMeta = genMeta;
        const generatedCode = codeGen.generate(callTestMethod);
        return generatedCode;
    }
}