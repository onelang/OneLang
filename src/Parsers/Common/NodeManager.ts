import { Reader } from "./Reader";
import { ArrayHelpers } from "../../Utils/ArrayHelpers";

export class NodeManager {
    nodes: any[] = [];

    constructor(public reader: Reader) {
    }

    addNode(node: any, start: number) {
        //node.nodeData = { sourceRange: { start, end: this.reader.wsOffset }, destRanges: {} };
        this.nodes.push(node);
    }

    getNodeAtOffset(offset: number) {
        const nodes = ArrayHelpers.sortBy(this.nodes.filter(x => x.nodeData && x.nodeData.sourceRange.start <= offset && offset < x.nodeData.sourceRange.end),
            x => x.nodeData.sourceRange.end - x.nodeData.sourceRange.start);
        return nodes.length === 0 ? null : nodes[0];
    }
}