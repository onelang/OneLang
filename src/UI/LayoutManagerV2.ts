﻿import * as GoldenLayout from "goldenlayout";

export class LayoutItem {
    constructor(public parent: Container, public contentItem: GoldenLayout.ContentItem) { }

    init() { /* */ }
}

export class Component extends LayoutItem {
    get component() { return <GoldenLayout.Component>(this.contentItem.isComponent ? this.contentItem : this.contentItem.contentItems[0]); }
    get container() { return this.component.container; }
    get element() { return this.container.getElement().get(0); }

    get title() { return this.component.config.title; }
    set title(newTitle: string) { this.component.setTitle(newTitle); }

    init() {
        var config = this.component && this.component.config;
        if (config && (typeof config.width === "number" || typeof config.height === "number"))
            this.container.setSize(config.width, config.height);
    }
}

export class ClosableComponent {
    lastHeight: number;
    lastWidth: number;
    component: Component = null;

    get visible() { return this.component !== null; }
    set visible(show: boolean) {
        if (show === this.visible) return;

        if (show)
            this.show();
        else
            this.hide();
    }

    constructor(public parent: Container, public generator: (c: Container) => Component, show: boolean) {
        if(show)
            this.show();
    }

    show() {
        this.component = this.generator(this.parent);
        if (this.lastHeight || this.lastWidth)
            this.component.container.setSize(this.lastWidth, this.lastHeight);

        this.component.container.on("resize", () => {
            var element = <JQuery><any>this.component.contentItem.element;
            this.lastHeight = element.outerHeight();
            this.lastWidth = element.outerWidth();
        });

        for (var event of ["destroy", "close"])
            this.component.container.on(event, () => {
                this.component = null;
                console.log("set");
            });
    }

    hide() {
        if (this.component)
            this.component.component.remove();
    }
}

export type ContainerType = "row" | "column" | "stack";
const fakeComponentName = "fakeComponent";
interface IComponentProps {
    width?: number;
    height?: number;
    isClosable?: boolean;
}

export class Container extends LayoutItem {
    public children: LayoutItem[] = [];

    addChild<T extends LayoutItem>(creator: { new (parent: Container, c: GoldenLayout.ContentItem): T }, props: any, cb?: (c: T) => void) {
        this.contentItem.addChild(Object.assign({ isClosable: false, children: [] }, props));
        var newItem = new creator(this, this.contentItem.contentItems.last());
        newItem.init();
        this.children.push(newItem);
        if (cb)
            cb(newItem);
        return typeof (cb) === "undefined" ? newItem : this;
    }

    addContainer(type: ContainerType, cb?: (c: Container) => void) {
        return this.addChild(Container, { type: type }, cb);
    }

    addHorizontal(cb?: (c: Container) => void) { return this.addContainer("row", cb); }
    addVertical(cb?: (c: Container) => void) { return this.addContainer("column", cb); }
    addTabs(cb?: (c: Container) => void) { return this.addContainer("stack", cb); }

    remove(item: LayoutItem) {
        this.children.remove(item);
        this.contentItem.removeChild(item.contentItem);
    }

    addComponent(title: string, props?: IComponentProps): Component;
    addComponent(title: string, cb: (c: Component) => void): Container;
    addComponent(title: string, props: IComponentProps, cb: (c: Component) => void): Container;
    addComponent(title: string, cbOrProps?: IComponentProps | ((c: Component) => void), cb?: (c: Component) => void): Container | Component {
        var props = typeof cbOrProps === "object" ? cbOrProps : null;
        cb = cb || (typeof cbOrProps === "function" ? cbOrProps : undefined);

        return this.addChild(Component, Object.assign({ type: "component", componentName: fakeComponentName, title: title }, props), cb);
    }

    addClosableComponent(generator: (c: Container) => Component, show: boolean, cb: (c: ClosableComponent) => void): Container {
        cb(new ClosableComponent(this, generator, show));
        return this;
    }

    init() {
        for (var child of this.children)
            child.init();
    }

    setConfig(config: any) {
        Object.assign(this.contentItem.config, config);
        return this;
    }
}

export class LayoutManager {
    public goldenLayout: GoldenLayout;
    public root: Container;

    constructor() {
        this.goldenLayout = new GoldenLayout({ settings: { showCloseIcon: false, showPopoutIcon: false }, content: [] });
        this.goldenLayout.registerComponent(fakeComponentName, function () { /* */ });
        this.goldenLayout.init();

        this.root = new Container(null, this.goldenLayout.root);
    }
}