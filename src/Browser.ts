import { Layout, LangUi } from "./UI/AppLayout";
import { CodeGenerator } from "./Generator/CodeGenerator";
import { langConfigs, LangConfig, CompileResult, LangConfigs } from "./Generator/LangConfigs";
import { TypeScriptParser } from "./Parsers/TypeScriptParser";
import { ExposedPromise } from "./Utils/ExposedPromise";
import { LangFileSchema } from "./Generator/LangFileSchema";
import { OneCompiler } from "./OneCompiler";

declare var YAML: any;

async function downloadTextFile(url: string): Promise<string> {
    const response = await (await fetch(url)).text();
    return response;
}

async function runLang(langConfig: LangConfig, code?: string) {
    if (code)
        langConfig.request.code = code;

    const response = await fetch(`http://127.0.0.1:${langConfig.port}/compile`, {
        method: 'post',
        mode: 'cors',
        body: JSON.stringify(langConfig.request)
    });

    const responseJson = <CompileResult> await response.json();
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

class CompileHelper {
    overlayContent: string;

    constructor(public langConfigs: LangConfigs) { }

    async init() {
        this.overlayContent = await downloadTextFile(`langs/NativeResolvers/typescript.ts`);

        for (const lang of Object.values(this.langConfigs))
            lang.schemaYaml = await downloadTextFile(`langs/${lang.name}.yaml`);
    }

    compile(programCode: string, langName: string) {
        const compiler = new OneCompiler();
        compiler.parseFromTS(programCode, this.overlayContent);
        const lang = this.langConfigs[langName];
        const code = compiler.compile(lang.schemaYaml, langName, !lang.request.className);
        return code;
    }
}

const compileHelper = new CompileHelper(langConfigs);

function initLayout() {
    layout.init();
    layout.onEditorChange = async (lang: string, newContent: string) => {
        console.log("editor change", lang, newContent);
        //new CodeGenerator(
        const sourceLangPromise = new ExposedPromise<string>();
        await Promise.all(Object.keys(layout.langs).map(async langName => {
            const langUi = layout.langs[langName];
            langUi.statusBar.text("loading...");
            try {
                const langConfig = langConfigs[langName];

                const code = compileHelper.compile(newContent, langName);
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
                html`<span class="result">${e}</span>`(langUi.statusBar);
                //langUi.changeHandler.setContent(`${e}`);
            }
        }));
    };
}

//runLangTests();

async function setupTestProgram() {
    const testPrg = await downloadTextFile("input/Test.ts");
    layout.langs["typescript"].changeHandler.setContent(testPrg, true);
}

async function main() {
    //runLangTests();
    //runLang(langConfigs.ruby);

    initLayout();
    await compileHelper.init();
    await setupTestProgram();
}

main();
