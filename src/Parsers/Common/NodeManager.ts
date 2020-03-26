import { Reader } from "./Reader";

export class NodeManager {
    nodes: any[] = [];

    constructor(public reader: Reader) {
    }

    addNode(node: any, start: number): void {
        this.nodes.push(node);
    }
}