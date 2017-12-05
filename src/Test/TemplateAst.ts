import { ExprLangAst as ExprAst } from "./ExprLangAst";

export namespace TemplateAst {
    export interface Node { }
    export interface BlockItem extends Node {
        inline: boolean;
    }
    export interface LineItem extends Node { }
    export interface ItemContainer extends Node { }
    
    export class Block implements ItemContainer {
        kind = "block";
        lines: BlockItem[] = [];
    }

    export class Line implements BlockItem, ItemContainer {
        line = "line";
        inline = false;
        indentLen: number;
        items: LineItem[] = [];
    }
    
    export class TextNode implements LineItem {
        kind = "text";
        constructor(public value: string) { }
    }
    
    export class TemplateNode implements LineItem {
        kind = "template";
        constructor(public expr: ExprAst.Expression) { }
    }
    
    export class ForNode implements BlockItem {
        kind = "for";
        body: ItemContainer;
        else: ItemContainer;
    
        constructor(public itemName: string, public arrayExpr: ExprAst.Expression, public inline: boolean, public separator = "") { }
    }
    
    export class IfItem {
        constructor(public condition: ExprAst.Expression, public body?: ItemContainer) { }
    }
    
    export class IfNode implements LineItem, BlockItem {
        kind = "if";
        items: IfItem[] = [];
        else: ItemContainer;
        inline: boolean;
    }
}
