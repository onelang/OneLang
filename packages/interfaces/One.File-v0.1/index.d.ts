declare class OneFile {
    static readText(fn: string): string;
    static writeText(fn: string, content: string): void;
    static listFiles(dir: string, recursive: boolean): string[];
}
