import { OneAst as ast } from "../../One/Ast";
import { Reader } from "./Reader";
import { sortBy } from "../../Utils/ArrayHelpers";

export class NodeManager {
    nodes: ast.INode[] = [];

    constructor(public reader: Reader) {
    }

    addNode(node: ast.INode, start: number) {
        node.nodeData = { sourceRange: { start, end: this.reader.wsOffset }, destRanges: {} };
        this.nodes.push(node);
    }

    getNodeAtOffset(offset: number) {
        const nodes = sortBy(this.nodes.filter(x => x.nodeData && x.nodeData.sourceRange.start <= offset && offset < x.nodeData.sourceRange.end),
            x => x.nodeData.sourceRange.end - x.nodeData.sourceRange.start);
        return nodes.length === 0 ? null : nodes[0];
    }
}