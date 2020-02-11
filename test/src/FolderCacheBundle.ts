import * as crypto from "crypto";
import { glob, readFile, exists, writeFile, deleteFile } from './TestUtils';

export class FolderCacheBundle {
    public cacheIdFn = ".cacheId";
    public files: { [path: string]: string; } = {};
    public isLoaded = false;
    public isDirty = false;
    public saveActions: { [path: string]: "write" | "delete"; } = {};

    constructor(public cachedFolder: string, public bundlePath: string = null) { }
    
    indexAllFiles() {
        this.files = {};
        const filenames = glob(this.cachedFolder);
        for (const fn of filenames)
            this.files[fn] = readFile(`${this.cachedFolder}/${fn}`);
        this.isDirty = true;
    }

    loadCache() {
        if (this.bundlePath) {
            const cacheIdPath = `${this.cachedFolder}/${this.cacheIdFn}`;
            if (!exists(this.bundlePath) || !exists(cacheIdPath)) {
                this.indexAllFiles();
            } else {
                this.files = JSON.parse(readFile(this.bundlePath));
                if (this.files[this.cacheIdFn] !== readFile(cacheIdPath))
                    this.indexAllFiles();
            }
        }
        else
            this.indexAllFiles();

        this.isLoaded = true;
    }

    save() {
        if (!this.isDirty || !this.isLoaded) return;
        
        if (this.bundlePath) {
            const cacheId = Array.from(crypto.randomFillSync(new Uint8Array(16))).map(x => x.toString(16)).join('');
            this.writeFile(this.cacheIdFn, cacheId);
            writeFile(this.bundlePath, JSON.stringify(this.files, null, 4));
        }

        for (const fn of Object.keys(this.saveActions)) {
            if (this.saveActions[fn] === "write")
                writeFile(`${this.cachedFolder}/${fn}`, this.files[fn]);
            else if (this.saveActions[fn] === "delete")
                deleteFile(`${this.cachedFolder}/${fn}`);
        }
    }

    writeFile(path: string, content: string) {
        if (!this.isLoaded) this.loadCache();
        if (this.files[path] === content) return;
        this.files[path] = content;
        this.saveActions[path] = "write";
        this.isDirty = true;
    }

    readFile(path: string) {
        if (!this.isLoaded) this.loadCache();
        return this.files[path];
    }

    deleteFile(path: string) {
        if (!this.isLoaded) this.loadCache();
        if (!this.files[path]) return;
        delete this.files[path];
        this.saveActions[path] = "delete";
        this.isDirty = true;
    }
}
