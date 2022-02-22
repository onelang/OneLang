import { readDir, baseDir, writeFile } from "./Utils/TestUtils";

const repoDir = "repository";
const packageNames = readDir(repoDir);

let indent = 0;
function log(...args: any[]) {
    if (!indent)
        console.log(...args);
    else
        console.log(' '.repeat(indent * 2 - 1), ...args);
}

console.log(`packageNames =`, packageNames);

for (const pkgName of packageNames) {
    log(`===> PKG: ${pkgName}`);
    indent++;
    const pkgDir = `${repoDir}/${pkgName}`;
    const pkgSubDirs = readDir(pkgDir);
    const containsApi = "api" in pkgSubDirs;
    if (containsApi)
        log(`contains API`);
    indent--;
}