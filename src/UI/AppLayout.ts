import { LayoutManager, Container, Component, ClosableComponent } from "./LayoutManagerV2";
import * as ace from "ace/ace";

export interface LangUi {
    editorComponent: Component,
    editor: AceAjax.Editor,
    changeHandler: EditorChangeHandler,
    statusBar: JQuery

    astHandler: EditorChangeHandler,
    astJsonHandler: EditorChangeHandler,
    overlayHandler: EditorChangeHandler,
    generatorHandler: EditorChangeHandler,
    stdLibHandler: EditorChangeHandler,
    generatedHandler: EditorChangeHandler,
}

interface LangConfig {
    langName: string;
    aceLang: string;
    title: string;
    isInput: boolean;
    isStd: boolean;
}

export class Layout {
    manager: LayoutManager;

    inputLangs: string[] = [];
    langs: { [lang: string]: LangUi } = {};
    genericTransformsHandler: EditorChangeHandler;
    oneStdLibHandler: EditorChangeHandler;

    errors: ClosableComponent;

    constructor(public layoutConfig: string = "**ts,cpp+cs,go+java|perl,php,python|ruby,swift,js") {
    }

    init() {
        this.manager = new LayoutManager();
        this.initLangComponents();
    }

    addLang(container: Container, config: LangConfig) {
        container.addTabs(tabs => {
            const langUi = <LangUi>{};
            tabs.addComponent(config.title, editorComp => {
                langUi.editorComponent = editorComp;

                const parent = $(`
                    <div class="editorDiv">
                        <div class="aceEditor" />
                        <div class="statusBar">status</div>
                    </div>
                `).appendTo(editorComp.element);

                langUi.statusBar = parent.find('.statusBar');
                langUi.editor = LayoutHelper.setupEditor(langUi.editorComponent, config.aceLang, parent.find('.aceEditor').get(0));
                langUi.changeHandler = new EditorChangeHandler(langUi.editor, 500, (newContent, userChange) => {
                    if (userChange && this.onEditorChange)
                        this.onEditorChange(config.langName, newContent);
                });
                if (!config.isStd)
                    langUi.generatedHandler = langUi.changeHandler;
            });

            if (config.isStd) {
                tabs.addComponent("Generated", c => {
                    const editor = LayoutHelper.setupEditor(c, config.aceLang);
                    langUi.generatedHandler = new EditorChangeHandler(editor, 500, (newContent, userChange) => {
                    });
                });
            }

            tabs.addComponent("Generator", c => {
                const editor = LayoutHelper.setupEditor(c, "yaml");
                langUi.generatorHandler = new EditorChangeHandler(editor, 500, (newContent, userChange) => {
                });
            });

            tabs.addComponent("StdLib", c => {
                const editor = LayoutHelper.setupEditor(c, config.aceLang);
                langUi.stdLibHandler = new EditorChangeHandler(editor, 500, (newContent, userChange) => {
                });
            });

            if (config.isInput) {
                tabs.addComponent("Overlay", c => {
                    const editor = LayoutHelper.setupEditor(c, config.aceLang);
                    langUi.overlayHandler = new EditorChangeHandler(editor, 500, (newContent, userChange) => {
                    });
                });

                tabs.addComponent("AST", c => {
                    const editor = LayoutHelper.setupEditor(c, "text");
                    langUi.astHandler = new EditorChangeHandler(editor, 500);
                });

                tabs.addComponent("AST (json)", c => {
                    const editor = LayoutHelper.setupEditor(c, "json");
                    langUi.astJsonHandler = new EditorChangeHandler(editor, 500);
                });
            }

            if (config.isStd) {
                // TODO: hack, these should be global tabs... on the other hand, the whole UI should be rethought, so whatever...
                tabs.addComponent("Transforms", c => {
                    const editor = LayoutHelper.setupEditor(c, "yaml");
                    this.genericTransformsHandler = new EditorChangeHandler(editor, 500, (newContent, userChange) => {
                    });
                });

                tabs.addComponent("One StdLib", c => {
                    const editor = LayoutHelper.setupEditor(c, "typescript");
                    this.oneStdLibHandler = new EditorChangeHandler(editor, 500, (newContent, userChange) => {
                    });
                });
            }

            tabs.setActiveTab(0);

            this.langs[config.langName] = langUi;            
        });
        return container;
    }

    initLangComponents() {
        const langData = {
            ts: { title: "TypeScript", langName: "typescript" },
            cpp: { title: "C++", aceLang: "c_cpp" },
            cs: { title: "C#", langName: "csharp" },
            go: { title: "Go", acelang: "swift" },
            java: { title: "Java" },
            perl: { title: "Perl" },
            php: { title: "PHP" },
            python: { title: "Python" },
            ruby: { title: "Ruby" },
            swift: { title: "Swift" },
            js: { title: "JavaScript", langName: "javascript" },
        };

        const mainColDescs = this.layoutConfig.split("|").map(rowDesc => {
            const rows = rowDesc.split(",").map(colDesc => ({ 
                cols: colDesc.split("+").map(langDesc => {
                    const configName = langDesc.replace(/\*/g, "");
                    const isInput = langDesc.includes("*");
                    const isStd = langDesc.includes("**");

                    const data = langData[configName];
                    const langName = data.langName || configName;

                    if (isInput)
                        this.inputLangs.push(langName);

                    return <LangConfig>{ 
                        langName,
                        isInput,
                        isStd,
                        aceLang: data.aceLang || langName,
                        title: data.title
                    };
                })
            }));
            const maxColCount = rows.reduce((x, y) => Math.max(x, y.cols.length), 0);
            return { rows, maxColCount };
        });

        const totalColumnCount = mainColDescs.reduce((x, y) => x + y.maxColCount, 0);

        this.manager.root.addHorizontal(mainCols => {
            for (const mainColDesc of mainColDescs) {
                mainCols.addVertical(rows => {
                    rows.setConfig({ width: 100 / totalColumnCount * mainColDesc.maxColCount });
                    for (const rowDesc of mainColDesc.rows) {
                        rows.addHorizontal(cols => {
                            for (const langConfig of rowDesc.cols)
                                this.addLang(cols, langConfig);
                        });
                    }
                });
            }
        });
        
        this.manager.root.init();
    }

    onEditorChange(lang: string, newContent: string) { }
}

export class EditorChangeHandler {
    editDelay: Delayed;
    internalChange: boolean;

    constructor(public editor: AceAjax.Editor, delay: number, public changeCallback: (newContent: string, userChange: boolean) => void = null) {
        this.editDelay = new Delayed(delay);

        if (this.editor && this.changeCallback)
            this.editor.on("change", () => {
                const wasInternalChange = this.internalChange;
                this.editDelay.do(() => this.changeCallback(this.editor.getValue(), !wasInternalChange))
            });
    }

    setContent(newContent: string, isUserChange = false) {
        if (!this.editor) return;

        if (this.editor.getValue() !== newContent) {
            this.internalChange = !isUserChange;
            this.editor.setValue(newContent, -1);
            this.internalChange = false;
        }
    }

    getContent() {
        return this.editor ? this.editor.getValue() : "";
    }
}

export class Delayed {
    private timeout: number;

    constructor(public delay: number) { }

    public do(func: () => void) {
        if (this.timeout)
            clearTimeout(this.timeout);

        this.timeout = <any>setTimeout(function () {
            this.timeout = null;
            func();
        }, this.delay);
    }
}

export class LayoutHelper {
    static setupEditor(container: Component, lang: string, element?: HTMLElement) {
        var editor = ace.edit(element || container.element);
        editor.setTheme("ace/theme/monokai");
        editor.getSession().setMode(`ace/mode/${lang}`);
        editor.$blockScrolling = Infinity; // TODO: remove this line after they fix ACE not to throw warning to the console
        container.container.on("resize", () => editor.resize());
        return editor;
    }
}
