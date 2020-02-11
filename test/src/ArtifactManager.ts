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
    constructor(public fs: IArtifactFileSystem) { }

    throwIfModified(destPath: string, newContent: string) {
        const pathParts = path.parse(destPath);
        const approvedPath = path.join(pathParts.dir, `${pathParts.name}.approved${pathParts.ext}`);
        
        const approved = this.fs.readFile(approvedPath);
        const currentContent = this.fs.readFile(destPath);
        try {
            if (approved) {
                if (approved === newContent)
                    this.fs.deleteFile(approvedPath);
                else
                    assert.equal(newContent, approved);
            } else if (currentContent) {
                if (newContent !== currentContent)
                    this.fs.writeFile(approvedPath, currentContent);
                assert.equal(newContent, currentContent);
            }
        }
        finally {
            if (currentContent !== newContent)
                this.fs.writeFile(destPath, newContent);
        }
    }
}
