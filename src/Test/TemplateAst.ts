import { ExprLangAst as ExprAst } from "./ExprLangAst";

export namespace TemplateAst {
    export interface Node { }
    
    export class Block {
        items: Node[] = [];
    }
    
    export class TextNode implements Node {
        constructor(public value: string) { }
    }
    
    export class TemplateNode implements Node {
        constructor(public expr: ExprAst.Expression) { }
    }
    
    export class ForNode implements Node {
        body: Block;
        else: Block;
    
        constructor(public itemName: string, public arrayExpr: ExprAst.Expression) { }
    }
    
    export class IfItem {
        constructor(public condition: ExprAst.Expression, public body?: Block) { }
    }
    
    export class IfNode implements Node {
        items: IfItem[] = [];
        else: Block;
    }
}
