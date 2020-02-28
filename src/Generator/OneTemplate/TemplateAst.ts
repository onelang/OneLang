import { IExpression } from "../ExprLang/ExprLangAst";

export interface Node { }
export interface BlockItem extends Node { 
    isInline(): boolean;
}

export interface LineItem extends Node { }
export interface ItemContainer extends Node { }

export class Block implements ItemContainer {
    lines: BlockItem[] = [];
}

export class Line implements BlockItem, ItemContainer {
    isInline() { return false; }
    indentLen = 0;
    items: LineItem[] = [];
}

export class TextNode implements LineItem {
    constructor(public value: string) { }
}

export class TemplateNode implements LineItem {
    constructor(public expr: IExpression) { }
}

export class ForNode implements BlockItem {
    body: ItemContainer;
    else: ItemContainer;

    constructor(public itemName: string, public arrayExpr: IExpression, public inline: boolean, public separator = "") { }
    isInline() { return this.inline; }
}

export class IfItem {
    constructor(public condition: IExpression, public body: ItemContainer = null) { }
}

export class IfNode implements LineItem, BlockItem {
    items: IfItem[] = [];
    else: ItemContainer;
    inline: boolean;
    isInline() { return this.inline; }
}
