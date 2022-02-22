import { baseDir } from './Utils/TestUtils';

const tmpDir = `${baseDir}/tmp/QuickCompileTest`;

interface IFileSystem {

}

class LocalFileSystem implements IFileSystem {
    constructor(public root: string) { }
}

class SourceProjectGenerator {
    constructor(public fs: IFileSystem) { }

    static create(projDir: string) {
        return new SourceProjectGenerator(new LocalFileSystem(projDir));
    }
}

new SourceProjectGenerator() {

}

console.log('hello', baseDir);