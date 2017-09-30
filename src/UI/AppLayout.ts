import { LayoutManager, Container, Component, ClosableComponent } from "./LayoutManagerV2";
import * as ace from "ace/ace";

export interface LangUi {
    component: Component,
    editor: AceAjax.Editor,
    changeHandler: EditorChangeHandler,
    statusBar: JQuery
}

export class Layout {
    manager: LayoutManager;

    langs: { [lang: string]: LangUi } = {};

    errors: ClosableComponent;

    constructor() {
    }

    init() {
        this.manager = new LayoutManager();
        this.initLangComponents();
    }

    initLangComponents() {
        this.manager.root
            .addHorizontal(mainCols => mainCols
                .addVertical(rows => rows.setConfig({ width: 50 })
                    .addComponent("TypeScript", c => this.initLang(c, "typescript"))
                    .addHorizontal(cols => cols
                        .addComponent("C++", c => this.initLang(c, "cpp", "c_cpp"))
                        .addComponent("C#", c => this.initLang(c, "csharp"))
                    )
                    .addHorizontal(cols => cols
                        .addComponent("Go", c => this.initLang(c, "go", "swift"))
                        .addComponent("Java", c => this.initLang(c, "java"))
                    )
                )
                .addVertical(rows => rows.setConfig({ width: 25 })
                    .addComponent("Perl", c => this.initLang(c, "perl"))
                    .addComponent("PHP", c => this.initLang(c, "php"))
                    .addComponent("Python", c => this.initLang(c, "python"))
                )
                .addVertical(rows => rows.setConfig({ width: 25 })
                    .addComponent("Ruby", c => this.initLang(c, "ruby"))
                    .addComponent("Swift", c => this.initLang(c, "swift"))
                    .addComponent("JavaScript", c => this.initLang(c, "javascript"))
                )
            );

        this.manager.root.init();
    }

    onEditorChange(lang: string, newContent: string) { }

    initLang(component: Component, name: string, aceLang: string = null) {
        const parent = $(`
            <div class="editorDiv">
                <div class="aceEditor" />
                <div class="statusBar">status</div>
            </div>
            `).appendTo(component.element);
        const statusBar = parent.find('.statusBar');
        const editor = LayoutHelper.setupEditor(component, aceLang || name, parent.find('.aceEditor').get(0));
        const changeHandler = new EditorChangeHandler(editor, 200, (newContent, userChange) => {
            if (userChange)
                this.onEditorChange(name, newContent);
        });

        this.langs[name] = { component, editor, changeHandler, statusBar };
    }
}

export class EditorChangeHandler {
    editDelay: Delayed;
    internalChange: boolean;

    constructor(public editor: AceAjax.Editor, delay: number, public changeCallback: (newContent: string, userChange: boolean) => void) {
        this.editDelay = new Delayed(delay);

        if (this.editor)
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
