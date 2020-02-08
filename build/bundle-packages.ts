import 'module-alias/register';
import { PackagesFolderSource } from "@one/StdLib/PackagesFolderSource";
import { writeFileSync } from "fs";

(async function() {
    const pkgDir = `${__dirname}/../packages`;
    const folderSrc = new PackagesFolderSource(pkgDir);
    const allPkgs = await folderSrc.getAllCached();
    const bundleJson = JSON.stringify(allPkgs, null, 4);
    writeFileSync(`${pkgDir}/bundle.json`, bundleJson);
})();