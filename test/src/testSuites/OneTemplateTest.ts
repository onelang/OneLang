import { runYamlTestSuite, assert } from "../TestUtils";
import { TemplateParser } from "@one/Generator/OneTemplate/TemplateParser";
import { TemplateGenerator, TemplateMethod } from "@one/Generator/OneTemplate/TemplateGenerator";
import { TemplateAst } from "@one/Generator/OneTemplate/TemplateAst";
import { TemplateAstPrinter } from "@one/Generator/OneTemplate/TemplateAstPrinter";
import { VariableContext, VariableSource } from "@one/Generator/ExprLang/ExprLangVM";
import { writeFile } from "../TestUtils";

interface TemplateTest {
    tmpl: string;
    model: object;
    expected: string;
    methods: { [name: string]: string };
}

function saveTemplateAst(name: string, tmplAst: TemplateAst.Block) {
    const tmplAstJson = JSON.stringify(tmplAst, null, 4);
    writeFile(`test/artifacts/TemplateTests/${name}.json`, tmplAstJson);

    const tmplSummary = new TemplateAstPrinter().print(tmplAst);
    writeFile(`test/artifacts/TemplateTests/${name}.txt`, tmplSummary);
}

runYamlTestSuite("OneTemplate", (name, test: TemplateTest) => {
    const model = {
        hasKey(obj, key) { return typeof obj[key] !== "undefined"; },
    };

    const tmplAst = TemplateParser.parse(test.tmpl);
    saveTemplateAst(name, tmplAst);
    
    const varContext = new VariableContext([
        VariableSource.fromObject(model, "test runner model"),
        VariableSource.fromObject(test.model, "test model")
    ]);

    const tmplGen = new TemplateGenerator(varContext);
    for (const signature of Object.keys(test.methods || [])) {
        const method = TemplateMethod.fromSignature(signature, test.methods[signature]);
        tmplGen.addMethod(method);
        saveTemplateAst(`${name}_${method.name}`, method.body);
    }

    const actual = tmplGen.generate(tmplAst);
    const expected = (test.expected || "").replace(/\\n/g, "\n");

    assert.deepStrictEqual(actual, expected);
});

