import { Layout, LangUi } from "./UI/AppLayout";
import { CodeGenerator, deindent, KsLangSchema } from "./CodeGenerator";
import { langConfigs, LangConfig } from "./langConfigs";
import { TypeScriptParser } from "./TypeScriptParser";

declare var YAML: any;

async function getLangTemplate(langName: string) {
    const response = await (await fetch(`langs/${langName}.yaml`)).text();
    return <KsLangSchema.LangFile> YAML.parse(response);
}

interface CompileResult {
    result?: string;
    elapsedMs?: number;
    exceptionText?: string;
}

async function runLang(langConfig: LangConfig, code?: string) {
    if (code)
        langConfig.request.code = code;

    const response = await fetch(`http://127.0.0.1:${langConfig.port}/compile`, {
        method: 'post',
        mode: 'cors',
        body: JSON.stringify(langConfig.request)
    });

    const responseJson = <CompileResult>await response.json();
    console.log(langConfig.name, responseJson);
    if (responseJson.exceptionText)
        console.log(langConfig.name, "Exception", responseJson.exceptionText);
    return responseJson;
}

async function runLangTests() {
    let langsToRun = Object.values(langConfigs);
    //langsToRun = ["java", "javascript", "typescript", "ruby", "php", "perl"];
    for (const lang of langsToRun)
        runLang(lang);
}

const layout = new Layout();

function html(parts: TemplateStringsArray, ...args: any[]) {
    return function(obj: JQuery) {
        obj.html(parts[0]);
        for (let i = 0; i < args.length; i++)
            obj.append(document.createTextNode(args[i]), parts[i + 1]);
    };
}

function initLayout() {
    layout.init();
    layout.onEditorChange = (lang: string, newContent: string) => {
        //console.log("editor change", lang, newContent);
        //new CodeGenerator(
        for (const langName of Object.keys(layout.langs)) {
            const langUi = layout.langs[langName];
            langUi.statusBar.html("loading...");
            try {
                const langConfig = langConfigs[langName];

                const schema = TypeScriptParser.parseFile(newContent);
                const codeGenerator = new CodeGenerator(schema, langConfig.schema);
                const generatedCode = codeGenerator.generate();
                const code = generatedCode.code.replace(/\n\n+/g, "\n\n").trim();
                if (langName !== lang)
                    langUi.changeHandler.setContent(code);
                //console.log(generatedCode.generatedTemplates);
                //console.log(generatedCode.code);
    
                runLang(langConfig, code).then(respJson => {
                    if (respJson.exceptionText)
                        html`<b>E:</b> ${respJson.exceptionText}}`(langUi.statusBar);
                    else
                        html`<b>R:</b> ${respJson.result || "<no result>"}`(langUi.statusBar);
                });
            } catch(e) {
                langUi.changeHandler.setContent(`${e}`);
            }
        }
    };
}

//runLangTests();

function setupTestProgram() {
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
}

async function main() {
    for (const langName of Object.keys(langConfigs)) {
        langConfigs[langName].name = langName;
        langConfigs[langName].schema = await getLangTemplate(langName);
    }

    initLayout();
    setupTestProgram();
    //console.log(JSON.stringify(schema, null, 4));
}

main();