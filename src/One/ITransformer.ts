import { Package } from "./Ast/Types";

export interface ITransformer {
    name: string;
    visitPackage(pkg: Package): void;
}