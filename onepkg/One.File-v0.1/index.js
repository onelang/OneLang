const glob = require('glob');
const fs = require('fs');
const path = require('path');

class OneFile {
    static readText(fn) { 
        return fs.readFileSync(fn, 'utf8');
    }

    static writeText(fn, content) {
        const dir = path.dirname(fn);
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir, { recursive: true });
        return fs.writeFileSync(fn, content, 'utf8');
    }

    static listFiles(dir, recursive) {
        if (!recursive)
            throw new Error("Not supported!");
        return glob.sync("**/*", { cwd: dir, nodir: true });
    }
    
}

exports.OneFile = OneFile;