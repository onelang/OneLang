import { LayoutManager, Container, Component, ClosableComponent } from "./LayoutManagerV2";
import * as ace from "ace/ace";

export interface LangUi {
    editorComponent: Component,
    editor: AceAjax.Editor,
    changeHandler: EditorChangeHandler,
    statusBar: JQuery

    astHandler: EditorChangeHandler,
    overlayHandler: EditorChangeHandler,
    generatorHandler: EditorChangeHandler,
    stdLibHandler: EditorChangeHandler,
}

interface TabContainer extends Container {
    addLang(title: string, langName: string, aceLang?: string);
    addInputLang(title: string, langName: string, aceLang?: string);
}

export class Layout {
    manager: LayoutManager;

    langs: { [lang: string]: LangUi } = {};
    genericTransformsHandler: EditorChangeHandler;
    oneStdLibHandler: EditorChangeHandler;

    errors: ClosableComponent;

    constructor() {
    }

    init() {
        this.manager = new LayoutManager();
        this.initLangComponents();
    }

    addLang(container: Container, title: string, langName: string, aceLang: string = null, isInput: boolean) {
        container.addTabs(tabs => {
            const langUi = <LangUi>{};
            tabs.addComponent(title, editorComp => {
                langUi.editorComponent = editorComp;

                const parent = $(`
                    <div class="editorDiv">
                        <div class="aceEditor" />
                        <div class="statusBar">status</div>
                    </div>
                `).appendTo(editorComp.element);

                langUi.statusBar = parent.find('.statusBar');
                langUi.editor = LayoutHelper.setupEditor(langUi.editorComponent, aceLang || langName, parent.find('.aceEditor').get(0));
                langUi.changeHandler = new EditorChangeHandler(langUi.editor, 500, (newContent, userChange) => {
                    if (userChange)
                        this.onEditorChange(langName, newContent);
                });
            });

            tabs.addComponent("Generator", c => {
                const editor = LayoutHelper.setupEditor(c, "yaml");
                langUi.generatorHandler = new EditorChangeHandler(editor, 500, (newContent, userChange) => {
                });
            });

            tabs.addComponent("StdLib", c => {
                const editor = LayoutHelper.setupEditor(c, langName);
                langUi.stdLibHandler = new EditorChangeHandler(editor, 500, (newContent, userChange) => {
                });
            });

            if (isInput) {
                tabs.addComponent("Overlay", c => {
                    const editor = LayoutHelper.setupEditor(c, langName);
                    langUi.overlayHandler = new EditorChangeHandler(editor, 500, (newContent, userChange) => {
                    });
                });

                tabs.addComponent("AST", c => {
                    const editor = LayoutHelper.setupEditor(c, "text");
                    langUi.astHandler = new EditorChangeHandler(editor, 500);
                });

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

            this.langs[langName] = langUi;            
        });
        return container;
    }

    setup(container: Container): TabContainer {
        const c = <TabContainer> container;
        c.addLang = (title: string, langName: string, aceLang?: string) => this.addLang(container, title, langName, aceLang, false);
        c.addInputLang = (title: string, langName: string, aceLang?: string) => this.addLang(container, title, langName, aceLang, true);
        return c;
    }

    initLangComponents() {
        this.manager.root
            .addHorizontal(mainCols => mainCols
                .addVertical(rows => this.setup(rows.setConfig({ width: 50 }))
                    .addInputLang("TypeScript", "typescript")
                    .addHorizontal(cols => this.setup(cols)
                        .addLang("C++", "cpp", "c_cpp")
                        .addLang("C#", "csharp")
                    )
                    .addHorizontal(cols => this.setup(cols)
                        .addLang("Go", "go", "swift")
                        .addLang("Java", "java")
                    )
                )
                .addVertical(rows => this.setup(rows.setConfig({ width: 25 }))
                    .addLang("Perl", "perl")
                    .addLang("PHP", "php")
                    .addLang("Python", "python")
                )
                .addVertical(rows => this.setup(rows.setConfig({ width: 25 }))
                    .addLang("Ruby", "ruby")
                    .addLang("Swift", "swift")
                    .addLang("JavaScript", "javascript")
                )
            );

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
