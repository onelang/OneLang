export class OneFile {
    static readText(fn: string): string;
    static writeText(fn: string, content: string);
    static listFiles(dir: string, recursive: boolean);
}