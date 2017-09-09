import { Layout, LangUi } from "./UI/AppLayout";
import { CodeGenerator, deindent, KsLangSchema } from "./CodeGenerator";
import { langConfigs, LangConfig } from "./langConfigs";
import { TypeScriptParser } from "./TypeScriptParser";
import { ExposedPromise } from "./ExposedPromise";

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

function escapeHtml(unsafe) {
    return unsafe.toString()
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }
 
 function html(parts: TemplateStringsArray, ...args: any[]) {
    return function(obj: JQuery) {
        let html = parts[0];
        for (let i = 0; i < args.length; i++)
            html += escapeHtml(args[i]) + parts[i + 1];
        obj.html(html);
        return obj;
    };
}

function initLayout() {
    layout.init();
    layout.onEditorChange = async (lang: string, newContent: string) => {
        //console.log("editor change", lang, newContent);
        //new CodeGenerator(
        const sourceLangPromise = new ExposedPromise<string>();
        await Promise.all(Object.keys(layout.langs).map(async langName => {
            const langUi = layout.langs[langName];
            langUi.statusBar.text("loading...");
            try {
                const langConfig = langConfigs[langName];

                const schema = TypeScriptParser.parseFile(newContent);
                const codeGenerator = new CodeGenerator(schema, langConfig.schema);
                const generatedCode = codeGenerator.generate(!langConfig.request.className);
                const code = generatedCode.code.replace(/\n\n+/g, "\n\n").trim();
                const isSourceLang = langName === lang;
                if (!isSourceLang)
                    langUi.changeHandler.setContent(code);
                //console.log(generatedCode.generatedTemplates);
                //console.log(generatedCode.code);
    
                runLang(langConfig, code).then(async respJson => {
                    if (respJson.exceptionText) {
                        langUi.statusBar.attr("title", respJson.exceptionText);
                        html`<span class="label error">error</span>${respJson.exceptionText}`(langUi.statusBar);
                    } else {
                        let result = respJson.result;
                        result = result === null ? "<null>" : result.toString();
                        if (result.endsWith("\n"))
                            result = result.substr(0, result.length - 1);

                        langUi.statusBar.attr("title", "");
                        html`<span class="label waiting">${respJson.elapsedMs}ms</span><span class="result">${result || "<no result>"}</span>`(langUi.statusBar);
                        if (isSourceLang)
                            sourceLangPromise.resolve(result);

                        const sourceLangResult = await sourceLangPromise;
                        const isMatch = result === sourceLangResult;
                        langUi.statusBar.find(".label").addClass(isMatch ? "success" : "error").removeClass("waiting");
                    }
                });
            } catch(e) {
                langUi.changeHandler.setContent(`${e}`);
            }
        }));
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
            return "Hello world!";
        }
    }`), true);
}

async function main() {
    for (const langName of Object.keys(langConfigs)) {
        langConfigs[langName].name = langName;
        langConfigs[langName].schema = await getLangTemplate(langName);
    }

    //runLangTests();
    //runLang(langConfigs.ruby);

    initLayout();
    setupTestProgram();
}

main();
