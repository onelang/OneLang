import { OneAst as ast } from "../../One/Ast";
import { Reader } from "./Reader";

export class NodeManager {
    nodes: ast.INode[] = [];

    constructor(public reader: Reader) {
    }

    addNode(node: ast.INode, start: number) {
        node.node = { sourceRange: { start, end: this.reader.wsOffset } };
        this.nodes.push(node);
    }

    getNodeAtOffset(offset: number) {
        const nodes = this.nodes.filter(x => x.node && x.node.sourceRange.start <= offset && offset < x.node.sourceRange.end)
            .sortBy(x => x.node.sourceRange.end - x.node.sourceRange.start);
        return nodes.length === 0 ? null : nodes[0];
    }
}