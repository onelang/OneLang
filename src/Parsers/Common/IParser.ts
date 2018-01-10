import { OneAst as one } from "../../One/Ast";
import { NodeManager } from "./NodeManager";

export interface IParser {
    parse(): one.Schema;
    nodeManager: NodeManager;
    langData: one.ILangData;
}
