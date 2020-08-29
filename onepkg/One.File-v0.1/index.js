const glob = require('glob');
const fs = require('fs');

class OneFile {
    static readText(fn) { 
        return fs.readFileSync(fn, 'utf8');
    }

    static writeText(fn, content) {
        return fs.writeFileSync(fn, content, 'utf8');
    }

    static listFiles(dir, recursive) {
        if (!recursive)
            throw new Error("Not supported!");
        return glob.sync("**/*", { cwd: dir, nodir: true });
    }
    
}

exports.OneFile = OneFile;