// @external
export declare class Fs {
    readFileSync(fn: string, encoding: string): string;
}

// @external
export declare class Glob {
    sync(dir: string, settings: any): string[];
}

// @external
export declare class Path {
    relative(dir: string, fn: string): string;
}