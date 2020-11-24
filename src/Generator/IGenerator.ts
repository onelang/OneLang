import { GeneratedFile } from "./GeneratedFile";
import { Package } from "../One/Ast/Types";
import { ITransformer } from "../One/ITransformer";
import { IGeneratorPlugin } from "./IGeneratorPlugin";
import { IExpression } from "../One/Ast/Interfaces";

export interface IGenerator {
    getLangName(): string;
    getExtension(): string;
    getTransforms(): ITransformer[];
    addPlugin(plugin: IGeneratorPlugin): void;
    addInclude(include: string): void;
    expr(expr: IExpression): string;
    generate(pkg: Package): GeneratedFile[];
}