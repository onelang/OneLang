import { Layout, LangUi, EditorChangeHandler } from "./UI/AppLayout";
import { CodeGenerator } from "./Generator/CodeGenerator";
import { langConfigs, LangConfig, CompileResult, LangConfigs } from "./Generator/LangConfigs";
import { TypeScriptParser } from "./Parsers/TypeScriptParser";
import { ExposedPromise } from "./Utils/ExposedPromise";
import { LangFileSchema } from "./Generator/LangFileSchema";
import { OneCompiler } from "./OneCompiler";
import { OverviewGenerator } from "./One/OverviewGenerator";
import { AstHelper } from "./One/AstHelper";

declare var YAML: any;

const testPrgName = "ReflectionTest";

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

    if (code) {
        langConfig.request.code = code;
        langConfig.request.stdlibCode = layout.langs[langConfig.name].stdLibHandler.getContent();
    }
    
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
    astOverview: string;
    astJsonOverview: string;

    constructor(public langConfigs: LangConfigs) { }

    async setContent(handler: EditorChangeHandler, url: string) {
        const content = await downloadTextFile(url);
        handler.setContent(content);
    }

    async init() {
        const tasks: Promise<void>[] = [];

        tasks.push(this.setContent(layout.langs.typescript.overlayHandler, `langs/NativeResolvers/typescript.ts`));
        tasks.push(this.setContent(layout.oneStdLibHandler, `langs/StdLibs/stdlib.d.ts`));
        tasks.push(this.setContent(layout.genericTransformsHandler, `langs/NativeResolvers/GenericTransforms.yaml`));

        for (const lang of Object.values(this.langConfigs)) {
            tasks.push(this.setContent(layout.langs[lang.name].generatorHandler, `langs/${lang.name}.yaml`));
            tasks.push(this.setContent(layout.langs[lang.name].stdLibHandler, `langs/StdLibs/${lang.stdlibFn}`));
        }

        await Promise.all(tasks);
    }

    compile(programCode: string, langName: string) {
        const compiler = new OneCompiler();

        const overlayContent = layout.langs.typescript.overlayHandler.getContent();
        const oneStdLibContent = layout.oneStdLibHandler.getContent();
        const genericTransforms = layout.genericTransformsHandler.getContent();
        
        compiler.parseFromTS(programCode, overlayContent, oneStdLibContent, genericTransforms);
        this.astOverview = new OverviewGenerator().generate(compiler.schemaCtx);
        this.astJsonOverview = AstHelper.toJson(compiler.schemaCtx.schema);

        const lang = this.langConfigs[langName];
        const schemaYaml = layout.langs[langName].generatorHandler.getContent();
        const code = compiler.compile(schemaYaml, langName, true);
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
                    (isSourceLang ? langUi.generatedHandler : langUi.changeHandler).setContent(code);
                    if (isSourceLang) {
                        langUi.astHandler.setContent(compileHelper.astOverview);
                        langUi.astJsonHandler.setContent(compileHelper.astJsonOverview);
                    }
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
