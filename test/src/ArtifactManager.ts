import * as assert from 'assert';
import * as path from 'path';
import { FolderCacheBundle } from "./FolderCacheBundle";

export class ArtifactManager {
    public cache: FolderCacheBundle;
    constructor(artifactsFolder = "test/artifacts", bundlePath = "tmp/artifacts.json") {
        this.cache = new FolderCacheBundle(artifactsFolder, bundlePath);
    }
    throwIfModified(destPath: string, newContent: string) {
        const pathParts = path.parse(destPath);
        const approvedPath = path.join(pathParts.dir, `${pathParts.name}.approved${pathParts.ext}`);
        try {
            const currentContent = this.cache.readFile(destPath);
            const approved = this.cache.readFile(approvedPath);
            if (approved) {
                if (approved === newContent)
                    this.cache.deleteFile(approvedPath);
                else
                    assert.equal(newContent, approved);
            }
            else if (currentContent) {
                if (newContent !== currentContent)
                    this.cache.writeFile(approvedPath, currentContent);
                assert.equal(newContent, currentContent);
            }
        }
        finally {
            this.cache.writeFile(destPath, newContent);
        }
    }
}
