import { GeneratedFile } from "./GeneratedFile";
import { Package } from "../One/Ast/Types";

export interface IGenerator {
    getLangName(): string;
    getExtension(): string;
    generate(pkg: Package): GeneratedFile[];
}