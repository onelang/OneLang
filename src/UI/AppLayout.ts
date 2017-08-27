import { LayoutManager, Container, Component, ClosableComponent } from "./LayoutManagerV2";
import * as ace from "ace/ace";

export class Layout {
    manager: LayoutManager;

    langComponents: { [lang: string]: Component } = {};
    langEditors: { [lang: string]: AceAjax.Editor } = {};
    errors: ClosableComponent;

    constructor() {
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

    initLang(c: Component, name: string, aceLang: string = null) {
        this.langComponents[name] = c;
        this.langEditors[name] = LayoutHelper.setupEditor(c, aceLang || name);
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
