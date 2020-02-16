import * as assert from 'assert';
import * as path from 'path';
import { readFile, exists, writeFile, deleteFile } from './TestUtils';

export interface IArtifactFileSystem {
    init();
    destroy();
    readFile(name: string);
    writeFile(name: string, content: string);
    deleteFile(name: string);
}

export class LocalFileSystem implements IArtifactFileSystem {
    constructor(public basePath: string) { }

    init() { }
    destroy() { }

    readFile(name: string) {
        const fullName = `${this.basePath}/${name}`;
        return exists(fullName) ? readFile(fullName) : null;
    }
    
    writeFile(name: string, content: string) {
        return writeFile(`${this.basePath}/${name}`, content);
    }
    
    deleteFile(name: string) {
        return deleteFile(`${this.basePath}/${name}`);
    }
}

export class ArtifactManager {
    errors: { fn: string; actual: string; expected: string; }[] = [];
    throwsAreDelayed = false;

    constructor(public fs: IArtifactFileSystem) { }

    delayThrows() {
        this.throwsAreDelayed = true;
        this.errors = [];
    }

    throwFirstDelayed() {
        this.throwsAreDelayed = false;
        if (this.errors.length === 0) return;
        const err = this.errors[0];
        assert.equal(err.actual, err.expected, `Artifact content changed: ${err.fn}`);
    }

    equals(fn, actual, expected) {
        if (actual === expected) return;
        if (this.throwsAreDelayed)
            this.errors.push({ fn, actual, expected });
        else
            assert.equal(actual, expected);
    }
        
    throwIfModified(fn: string, newContent: string) {
        const approvedPath = `.approved/${fn}`;
        const approved = this.fs.readFile(approvedPath);
        const currentContent = this.fs.readFile(fn);
        try {
            if (approved) {
                if (approved === newContent)
                    this.fs.deleteFile(approvedPath);
                else
                    return this.equals(fn, newContent, approved);
            } else if (currentContent) {
                if (newContent !== currentContent)
                    this.fs.writeFile(approvedPath, currentContent);
                return this.equals(fn, newContent, currentContent);
            }
        }
        finally {
            if (currentContent !== newContent)
                this.fs.writeFile(fn, newContent);
        }
    }
}
