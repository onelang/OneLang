import { Expression } from "../ExprLang/ExprLangAst";

export interface Node { }
export interface BlockItem extends Node { inline: boolean; }
export interface LineItem extends Node { }
export interface ItemContainer extends Node { }

export class Block implements ItemContainer {
    kind = "block";
    lines: BlockItem[] = [];
}

export class Line implements BlockItem, ItemContainer {
    kind = "line";
    inline = false;
    indentLen = 0;
    items: LineItem[] = [];
}

export class TextNode implements LineItem {
    kind = "text";
    constructor(public value: string) { }
}

export class TemplateNode implements LineItem {
    kind = "template";
    constructor(public expr: Expression) { }
}

export class ForNode implements BlockItem {
    kind = "for";
    body: ItemContainer;
    else: ItemContainer;

    constructor(public itemName: string, public arrayExpr: Expression, public inline: boolean, public separator = "") { }
}

export class IfItem {
    constructor(public condition: Expression, public body?: ItemContainer) { }
}

export class IfNode implements LineItem, BlockItem {
    kind = "if";
    items: IfItem[] = [];
    else: ItemContainer;
    inline: boolean;
}
