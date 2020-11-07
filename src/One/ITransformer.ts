import { SourceFile } from "./Ast/Types";

export interface ITransformer {
    name: string;
    visitFiles(files: SourceFile[]): void;
}