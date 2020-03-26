export declare class Fs {
    readFileSync(fn: string, encoding: string): string;
}

export declare class Glob {
    sync(dir: string, settings: any): string[];
}

export declare class Path {
    relative(dir: string, fn: string): string;
}