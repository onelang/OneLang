import { Layout, LangUi, EditorChangeHandler } from "./UI/AppLayout";
import { CodeGenerator } from "./Generator/CodeGenerator";
import { langConfigs, LangConfig, CompileResult, LangConfigs } from "./Generator/LangConfigs";
import { ExposedPromise } from "./Utils/ExposedPromise";
import { LangFileSchema } from "./Generator/LangFileSchema";
import { OneCompiler } from "./OneCompiler";
import { OverviewGenerator } from "./One/OverviewGenerator";
import { AstHelper } from "./One/AstHelper";

declare var YAML: any;

const qs = {};
location.search.substr(1).split('&').map(x => x.split('=')).forEach(x => qs[x[0]] = x[1]);
const serverhost: string = "server" in qs ? qs["server"] : location.hostname === "127.0.0.1" ? "http://127.0.0.1:11111" : null;

const testPrgName = qs["input"] || "HelloWorldRaw";

async function downloadTextFile(url: string): Promise<string> {
    const response = await (await fetch(url)).text();
    return response;
}

let authTokenPromise: Promise<string>;

async function apiCall<TResponse>(endpoint: string, request: object = null): Promise<TResponse> {
    let authToken = await authTokenPromise;

    if (authToken) {
        localStorage[`authToken[${serverhost}]`] = authToken;
    } else {
        authToken = localStorage[`authToken[${serverhost}]`];
    }

    const response = await fetch(`${serverhost}/${endpoint}`, {
        method: 'post',
        mode: 'cors',
        body: request ? JSON.stringify(request) : null,
        headers: new Headers(authToken ? { 'Authentication': `Token ${authToken}` } : {})
    });

    const responseObj = await response.json();
    return <TResponse> responseObj;
}

async function runLang(langConfig: LangConfig, code: string) {
    langConfig.request.code = code;
    langConfig.request.packageSources = [{ packageName: 'one', fileName: 'one', code: layout.langs[langConfig.name].stdLibHandler.getContent() }];
    
    const responseJson = await apiCall<CompileResult>("compile", langConfig.request);
    console.log(langConfig.name, responseJson);
    if (responseJson.exceptionText)
        console.log(langConfig.name, "Exception", responseJson.exceptionText);
    return responseJson;
}

const layout = new Layout(qs["layout"]);

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
    compiler: OneCompiler;
    astOverview: string;
    astJsonOverview: string;

    constructor(public langConfigs: LangConfigs) { }

    async setContent(handler: EditorChangeHandler, url: string) {
        const content = await downloadTextFile(url);
        handler.setContent(content);
    }

    async init() {
        const tasks: Promise<void>[] = [];

        for (const lang of layout.inputLangs)
            tasks.push(this.setContent(layout.langs[lang].overlayHandler, `langs/NativeResolvers/${lang}.ts`));

        tasks.push(this.setContent(layout.oneStdLibHandler, `langs/StdLibs/stdlib.d.ts`));
        tasks.push(this.setContent(layout.genericTransformsHandler, `langs/NativeResolvers/GenericTransforms.yaml`));

        for (const lang of Object.values(this.langConfigs)) {
            if (!layout.langs[lang.name]) continue;
            tasks.push(this.setContent(layout.langs[lang.name].generatorHandler, `langs/${lang.name}.yaml`));
            tasks.push(this.setContent(layout.langs[lang.name].stdLibHandler, `langs/StdLibs/${lang.stdlibFn}`));
        }

        await Promise.all(tasks);
    }

    setProgram(programCode: string, langName: string) {
        this.compiler = new OneCompiler();

        const overlayContent = layout.langs[langName].overlayHandler.getContent();
        const oneStdLibContent = layout.oneStdLibHandler.getContent();
        const genericTransforms = layout.genericTransformsHandler.getContent();
        
        this.compiler.setup(overlayContent, oneStdLibContent, genericTransforms);
        this.compiler.parse(langName, programCode);
        this.astOverview = new OverviewGenerator().generate(this.compiler.schemaCtx);
        this.astJsonOverview = AstHelper.toJson(this.compiler.schemaCtx.schema);
    }

    compile(langName: string) {
        const lang = this.langConfigs[langName];
        const schemaYaml = layout.langs[langName].generatorHandler.getContent();
        // TODO: pacMan is null
        const code = this.compiler.compile(schemaYaml, null, true, layout.inputLangs.includes(langName));
        return code;
    }
}

const compileHelper = new CompileHelper(langConfigs);

function statusBarError(langUi: LangUi, error: string) {
    langUi.statusBar.attr("title", error);
    html`<span class="label error">error</span>${error}`(langUi.statusBar);
}

async function runLangUi(langName: string, codeCallback: () => string) {
    const langUi = layout.langs[langName];
    langUi.statusBar.text("loading...");
    try {
        const langConfig = langConfigs[langName];

        const code = codeCallback();
        if (!serverhost) {
            html`<span class="label note">note</span><a class="compilerMissing" href="https://github.com/koczkatamas/onelang/wiki/Compiler-backend" target="_blank">Compiler backend is not configured</a>`(langUi.statusBar);
            return;
        }

        const respJson = await runLang(langConfig, code);
        if (respJson.exceptionText) {
            statusBarError(langUi, respJson.exceptionText);
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
        if (e.message === "Failed to fetch") {
            statusBarError(langUi, `Compiler backend (${serverhost}) is unavailable!`);
        } else {
            statusBarError(langUi, e);
        }
        //langUi.changeHandler.setContent(`${e}`);
    }
}

let AceRange = require("ace/range").Range;
class MarkerManager {
    markerRemovalCallbacks: (() => void)[] = [];

    addMarker(editor: AceAjax.Editor, start: number, end: number, focus: boolean) {
        const session = editor.getSession();
        const document = session.getDocument();
        const startPos = document.indexToPosition(start, 0);
        const endPos = document.indexToPosition(end, 0);
        const range = <AceAjax.Range>new AceRange(startPos.row, startPos.column, endPos.row, endPos.column);
        const markerId = session.addMarker(range, startPos.row !== endPos.row ? "ace_step_multiline" : "ace_step", "text", false);
        this.markerRemovalCallbacks.push(() => session.removeMarker(markerId));
        if (focus) {
            (<any>editor).renderer.scrollCursorIntoView({ row: endPos.row, column: endPos.column + 3 }, 0.5);
            (<any>editor).renderer.scrollCursorIntoView({ row: startPos.row, column: startPos.column - 3 }, 0.5);
        }
    }

    removeMarkers() {
        for (const cb of this.markerRemovalCallbacks)
            cb();
    }

    getFileOffset(editor: AceAjax.Editor) {
        return editor.getSession().getDocument().positionToIndex(editor.getCursorPosition(), 0);
    }
}
let markerManager = new MarkerManager();

async function editorChange(sourceLang: string, newContent: string) {
    console.log("editor change", sourceLang, newContent);
    markerManager.removeMarkers();

    if (layout.inputLangs.includes(sourceLang)) {
        try {
            compileHelper.setProgram(newContent, sourceLang);
            const sourceLangUi = layout.langs[sourceLang];
            sourceLangUi.astHandler.setContent(compileHelper.astOverview);
            sourceLangUi.astJsonHandler.setContent(compileHelper.astJsonOverview);
        } catch(e) {
            statusBarError(layout.langs[sourceLang], e);
            return;
        }

        const sourceLangPromise = new ExposedPromise<string>();
        await Promise.all(Object.keys(layout.langs).map(async langName => {
            const langUi = layout.langs[langName];
            const isSourceLang = langName === sourceLang;

            const result = await runLangUi(langName, () => {
                const code = compileHelper.compile(langName);
                if (!isSourceLang)
                    langUi.changeHandler.setContent(code);
                langUi.generatedHandler.setContent(code);
                return code;
            });
            
            if (isSourceLang)
                sourceLangPromise.resolve(result);

            if (result) {
                const sourceLangResult = await sourceLangPromise;
                const isMatch = result === sourceLangResult;
                langUi.statusBar.find(".label").removeClass("success").addClass(isMatch ? "success" : "warning");
            }
        }));
    } else {
        runLangUi(sourceLang, () => newContent);
    }
}

function initLayout() {
    layout.init(document.getElementById("goldenLayout"));
    for (const langName of Object.keys(layout.langs)) {
        layout.langs[langName].editor.commands.addCommand({
            name: "compile",
            bindKey: { win: "Ctrl-Enter", mac: "Command-Enter" },
            exec: function (editor) { editorChange(langName, editor.getValue()); }
        });
    }
    layout.onEditorChange = "noAutoRefresh" in qs ? null : editorChange;

    window["layout"] = layout;

    for (const inputLang_ of layout.inputLangs) {
        const inputLang = inputLang_;
        const inputEditor = layout.langs[inputLang].changeHandler.editor;
        inputEditor.getSelection().on('changeCursor', () => {
            if (!compileHelper.compiler || compileHelper.compiler.langName !== inputLang) return;
            markerManager.removeMarkers();
            const index = markerManager.getFileOffset(inputEditor);
            const node = compileHelper.compiler.parser.nodeManager.getNodeAtOffset(index);
            if (!node) return;
            console.log(index, node);
            markerManager.addMarker(inputEditor, node.nodeData.sourceRange.start, node.nodeData.sourceRange.end, false);
            for (const langName of Object.keys(node.nodeData.destRanges)) {
                const dstRange = node.nodeData.destRanges[langName];
                if (langName !== inputLang)
                    markerManager.addMarker(layout.langs[langName].changeHandler.editor, dstRange.start, dstRange.end, true);
            }
        });
    }
}

async function setupTestProgram() {
    const testPrg = await downloadTextFile(`input/${testPrgName}.ts`);
    layout.langs["typescript"].changeHandler.setContent(testPrg.replace(/\r\n/g, '\n'), true);
}

async function backendInit() {
    const statusResponse = await apiCall<any>("status");
    if (statusResponse.errorCode === "invalid_token") {
        return new Promise<string>((resolve, reject) => {
            $("#authTokenModal").modal().on('hide.bs.modal', () => {
                resolve($("#authToken").val().trim());
            });
        });
    } else {
        return null;
    }
}

async function main() {
    initLayout();
    
    $("#welcomeDoNotShowAgain").click(() => localStorage.setItem("doNotShowWelcome", "true"));
    if (localStorage.getItem("doNotShowWelcome") !== "true")
        $("#welcomeModal").modal();        

    authTokenPromise = backendInit();
    await compileHelper.init();
    await setupTestProgram();
}

main();
