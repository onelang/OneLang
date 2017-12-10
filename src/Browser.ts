import { Layout, LangUi } from "./UI/AppLayout";
import { CodeGenerator } from "./Generator/CodeGenerator";
import { langConfigs, LangConfig, CompileResult, LangConfigs } from "./Generator/LangConfigs";
import { TypeScriptParser } from "./Parsers/TypeScriptParser";
import { ExposedPromise } from "./Utils/ExposedPromise";
import { LangFileSchema } from "./Generator/LangFileSchema";
import { OneCompiler } from "./OneCompiler";

declare var YAML: any;

const testPrgName = "ExceptionTest";

const qs = {};
location.search.substr(1).split('&').map(x => x.split('=')).forEach(x => qs[x[0]] = x[1]);
const localhost = location.hostname === "127.0.0.1" || location.hostname === "localhost";
const serverhost: string = qs["server"] || (localhost && "127.0.0.1");
const httpsMode = serverhost.startsWith("https://");

async function downloadTextFile(url: string): Promise<string> {
    const response = await (await fetch(url)).text();
    return response;
}

async function runLang(langConfig: LangConfig, code?: string) {
    if (!serverhost)
        throw new Error("No compilation backend!");

    if (code)
        langConfig.request.code = code;
    
    const endpoint = httpsMode ? `${serverhost}/${langConfig.httpsEndpoint || "compile"}` : 
        `http://${serverhost}:${langConfig.port}/compile`;

    const response = await fetch(endpoint, {
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
    stdlibContent: string;
    genericTransforms: string;

    constructor(public langConfigs: LangConfigs) { }

    async init() {
        this.overlayContent = await downloadTextFile(`langs/NativeResolvers/typescript.ts`);
        this.stdlibContent = await downloadTextFile(`langs/StdLibs/stdlib.d.ts`);
        this.genericTransforms = await downloadTextFile(`langs/NativeResolvers/GenericTransforms.yaml`);

        for (const lang of Object.values(this.langConfigs))
            lang.schemaYaml = await downloadTextFile(`langs/${lang.name}.yaml`);
    }

    compile(programCode: string, langName: string) {
        const compiler = new OneCompiler();
        compiler.parseFromTS(programCode, this.overlayContent, this.stdlibContent, this.genericTransforms);
        const lang = this.langConfigs[langName];
        const code = compiler.compile(lang.schemaYaml, langName, true);
        return code;
    }
}

const compileHelper = new CompileHelper(langConfigs);

async function runLangUi(langName: string, codeCallback: () => string) {
    const langUi = layout.langs[langName];
    langUi.statusBar.text("loading...");
    try {
        const langConfig = langConfigs[langName];

        const code = codeCallback();
        const respJson = await runLang(langConfig, code);

        if (respJson.exceptionText) {
            langUi.statusBar.attr("title", respJson.exceptionText);
            html`<span class="label error">error</span>${respJson.exceptionText}`(langUi.statusBar);
        } else {
            let result = respJson.result;
            result = result === null ? "<null>" : result.toString();
            if (result.endsWith("\n"))
                result = result.substr(0, result.length - 1);

            langUi.statusBar.attr("title", result);
            html`<span class="label success">${respJson.elapsedMs}ms</span><span class="result">${result || "<no result>"}</span>`(langUi.statusBar);
            return result;
        }
    } catch(e) {
        html`<span class="result">${e}</span>`(langUi.statusBar);
        //langUi.changeHandler.setContent(`${e}`);
    }
}

function initLayout() {
    layout.init();
    layout.onEditorChange = async (sourceLang: string, newContent: string) => {
        console.log("editor change", sourceLang, newContent);

        if (sourceLang === "typescript") {
            const sourceLangPromise = new ExposedPromise<string>();
            await Promise.all(Object.keys(layout.langs).map(async langName => {
                const langUi = layout.langs[langName];
                const isSourceLang = langName === sourceLang;
    
                const result = await runLangUi(langName, () => {
                    const code = compileHelper.compile(newContent, langName);
                    if (!isSourceLang)
                        langUi.changeHandler.setContent(code);
                    return code;
                });
                
                if (isSourceLang)
                    sourceLangPromise.resolve(result);
    
                const sourceLangResult = await sourceLangPromise;
                const isMatch = result === sourceLangResult;
                langUi.statusBar.find(".label").removeClass("success").addClass(isMatch ? "success" : "error");
            }));
        } else {
            runLangUi(sourceLang, () => newContent);
        }
    };
}

//runLangTests();

async function setupTestProgram() {
    const testPrg = await downloadTextFile(`input/${testPrgName}.ts`);
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
