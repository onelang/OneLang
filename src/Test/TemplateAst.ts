import { ExprLangAst as ExprAst } from "./ExprLangAst";

export namespace TemplateAst {
    export interface Node { }
    
    export class Block {
        kind = "block";
        items: Node[] = [];
    }
    
    export class TextNode implements Node {
        kind = "text";
        constructor(public value: string) { }
    }
    
    export class TemplateNode implements Node {
        kind = "template";
        constructor(public expr: ExprAst.Expression) { }
    }
    
    export class ForNode implements Node {
        kind = "for";
        body: Block;
        else: Block;
    
        constructor(public itemName: string, public arrayExpr: ExprAst.Expression, public inline: boolean, public separator = "") { }
    }
    
    export class IfItem {
        constructor(public condition: ExprAst.Expression, public body?: Block) { }
    }
    
    export class IfNode implements Node {
        kind = "if";
        items: IfItem[] = [];
        else: Block;
        inline: boolean;
    }
}
