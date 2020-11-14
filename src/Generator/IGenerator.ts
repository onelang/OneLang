import { GeneratedFile } from "./GeneratedFile";
import { Package } from "../One/Ast/Types";
import { ITransformer } from "../One/ITransformer";

export interface IGenerator {
    getLangName(): string;
    getExtension(): string;
    getTransforms(): ITransformer[];
    generate(pkg: Package): GeneratedFile[];
}