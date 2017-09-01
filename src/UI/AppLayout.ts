import { LayoutManager, Container, Component, ClosableComponent } from "./LayoutManagerV2";
import * as ace from "ace/ace";

export class Layout {
    manager: LayoutManager;

    langs: { [lang: string]: { 
        component: Component,
        editor: AceAjax.Editor,
        changeHandler: EditorChangeHandler 
    } } = {};

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
                .addVertical(rows => rows
                    .addComponent("TypeScript", c => this.initLang(c, "typescript"))
                    .addComponent("C++", c => this.initLang(c, "cpp", "c_cpp"))
                    .addComponent("C#", c => this.initLang(c, "csharp"))
                )
                .addVertical(rows => rows
                    .addComponent("Go", c => this.initLang(c, "go", "swift"))
                    .addComponent("Java", c => this.initLang(c, "java"))
                    .addComponent("Perl", c => this.initLang(c, "perl"))
                )
                .addVertical(rows => rows
                    .addComponent("PHP", c => this.initLang(c, "php"))
                    .addComponent("Python", c => this.initLang(c, "python"))
                    .addComponent("Ruby", c => this.initLang(c, "ruby"))
                )
            );

        this.manager.root.init();
    }

    onEditorChange(lang: string, newContent: string) { }

    initLang(component: Component, name: string, aceLang: string = null) {
        const editor = LayoutHelper.setupEditor(component, aceLang || name);
        const changeHandler = new EditorChangeHandler(editor, 200, (newContent, userChange) => {
            if (userChange)
                this.onEditorChange(name, newContent);
        });

        this.langs[name] = { component, editor, changeHandler };
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
    static setupEditor(parent: Component, lang: string) {
        var editor = ace.edit(parent.element);
        editor.setTheme("ace/theme/monokai");
        editor.getSession().setMode(`ace/mode/${lang}`);
        editor.$blockScrolling = Infinity; // TODO: remove this line after they fix ACE not to throw warning to the console
        parent.container.on("resize", () => editor.resize());
        return editor;
    }
}
