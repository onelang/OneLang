import { NodeManager } from "./NodeManager";
import { SourceFile } from "../../One/Ast/Types";

export interface IParser {
    parse(): SourceFile;
    nodeManager: NodeManager;
}
