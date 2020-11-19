const glob = require('glob');
const fs = require('fs');
const path = require('path');

class OneFile {
    static readText(fn) { 
        return fs.readFileSync(fn, 'utf8');
    }

    static providePath(fn) {
        const dir = path.dirname(fn);
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir, { recursive: true });
        return fn;
    }

    static writeText(fn, content) {
        return fs.writeFileSync(this.providePath(fn), content, 'utf8');
    }

    static listFiles(dir, recursive) {
        if (!recursive)
            throw new Error("Not supported!");
        const files = glob.sync("**/*", { cwd: dir, nodir: true });
        files.sort();
        return files;
    }
    
    static copy(srcFn, dstFn) {
        fs.copyFileSync(srcFn, this.providePath(dstFn));
    }
}

exports.OneFile = OneFile;