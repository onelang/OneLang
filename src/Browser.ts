import { Layout } from "./UI/AppLayout";
import { CodeGenerator, deindent, KsLangSchema } from "./CodeGenerator";
import { langConfigs } from "./langConfigs";
import { TypeScriptParser } from "./TypeScriptParser";

declare var YAML: any;

async function getLangTemplate(langName: string) {
    const response = await (await fetch(`langs/${langName}.yaml`)).text();
    return <KsLangSchema.LangFile> YAML.parse(response);
}

async function runLang(name: string, code?: string) {
    const langConfig = langConfigs[name];
    if (code)
        langConfig.request.code = code;
    const response = await fetch(`http://127.0.0.1:${langConfig.port}/compile`, {
        method: 'post',
        mode: 'cors',
        body: JSON.stringify(langConfig.request)
    });

    const responseJson = await response.json();
    console.log(name, responseJson);
    if (responseJson.exceptionText)
        console.log(name, "Exception", responseJson.exceptionText);
    return responseJson;
}

async function runLangTests() {
    let langsToRun = Object.keys(langConfigs);
    //langsToRun = ["java", "javascript", "typescript", "ruby", "php", "perl"];
    for (const lang of langsToRun)
        runLang(lang);
}

const layout = new Layout();

function initLayout() {
    layout.init();
    layout.onEditorChange = (lang: string, newContent: string) => {
        //console.log("editor change", lang, newContent);
        //new CodeGenerator(
        for (const langName of Object.keys(layout.langs)) {
            if (langName === lang) continue;
            //if (langName !== "go") continue;

            const changeHandler = layout.langs[langName].changeHandler;
            try {
                const langSchema = langConfigs[langName]["schema"];
                //console.log("langSchema", langSchema);

                const schema = TypeScriptParser.parseFile(newContent);
                const codeGenerator = new CodeGenerator(schema, langSchema);
                const generatedCode = codeGenerator.generate();
                //console.log(generatedCode.generatedTemplates);
                //console.log(generatedCode.code);
    
                const code = generatedCode.code.replace(/\n\n+/g, "\n\n").trim();
                changeHandler.setContent(code);
                runLang(langName, code);
            } catch(e) {
                changeHandler.setContent(`${e}`);
            }
        }
    };
}

//runLangTests();

async function main() {
    for (const langName of Object.keys(langConfigs))
        langConfigs[langName].schema = await getLangTemplate(langName);

    initLayout();

    layout.langs["typescript"].changeHandler.setContent(deindent(`
        class TestClass {
            calc() {
                return (1 + 2) * 3;
            }
        
            methodWithArgs(arg1: number, arg2: number, arg3: number) {
                return arg1 + arg2 + arg3 * this.calc();
            }
        
            testMethod() {
                StdLib.Console.print("Hello world!");
            }
        }`), true);
    //console.log(JSON.stringify(schema, null, 4));
}

main();