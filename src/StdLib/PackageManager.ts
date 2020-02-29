import { Helpers } from "../Utils/Helpers";
import * as YAML from "js-yaml";
import { LangFile } from "../Generator/LangFileSchema";

export enum PackageType { Interface, Implementation }

export class PackageId {
    constructor(public type: PackageType, public name: string, public version: string) { }
}

export class PackageContent {
    constructor(public id: PackageId, public files: { [path: string]: string }, fromCache: boolean) { }
}

export class PackageBundle {
    constructor(public packages: PackageContent[]) { }
}

export interface PackageSource {
    getPackageBundle(ids: PackageId[], cachedOnly: boolean): Promise<PackageBundle>;
    getAllCached(): Promise<PackageBundle>;
}

export class PackageNativeImpl {
    pkgName: string;
    pkgVendor: string;
    pkgVersion: string;
    fileName: string;
    code: string;
}

export interface InterfaceYaml {
    "file-version": number;
    vendor: string;
    name: string;
    version: number;
    "definition-file": string;
}

export class InterfacePackage {
    interfaceYaml: InterfaceYaml;
    definition: string;

    constructor(public content: PackageContent) {
        this.interfaceYaml = YAML.safeLoad(content.files["interface.yaml"]);
        this.definition = content.files[this.interfaceYaml["definition-file"]];
    }
}

export class ImplPkgImplIntf { 
    name: string;
    minver: number;
    maxver: number;
}

export class ImplPkgImplementation {
    interface: ImplPkgImplIntf;
    language: string;
    "native-includes": string[];
    "native-includes-dir": string;
    implementation: LangFile;
}

export class ImplPackageYaml {
    "file-version": number;
    vendor: string;
    name: string;
    description: string;
    version: string;
    includes: string[];
    implements: ImplPkgImplementation[];
}

export class ImplementationPackage {
    implementationYaml: ImplPackageYaml;
    implementations: ImplPkgImplementation[] = [];

    constructor(public content: PackageContent) {
        this.implementationYaml = YAML.safeLoad(content.files["package.yaml"]);
        this.implementations = [];
        for (const impl of this.implementationYaml.implements||[])
            this.implementations.push(impl);
        for (const include of this.implementationYaml.includes||[]) {
            const included = <ImplPackageYaml> YAML.safeLoad(content.files[include]);
            for (const impl of included.implements)
                this.implementations.push(impl);
        }
    }
}

export class PackageManager {
    intefacesPkgs: InterfacePackage[] = [];
    implementationPkgs: ImplementationPackage[] = [];

    constructor(public source: PackageSource) { }

    async loadAllCached() {
        const allPackages = await this.source.getAllCached();

        for (const content of allPackages.packages.filter(x => x.id.type === PackageType.Interface))
            this.intefacesPkgs.push(new InterfacePackage(content));

        for (const content of allPackages.packages.filter(x => x.id.type === PackageType.Implementation))
            this.implementationPkgs.push(new ImplementationPackage(content));
    }

    getLangImpls(langName: string): ImplPkgImplementation[] {
        const allImpls = [];
        for (const pkg of this.implementationPkgs)
            for (const impl of pkg.implementations)
                allImpls.push(impl);
        return allImpls.filter(x => x.language === langName);
    }

    loadImplsIntoLangFile(lang: LangFile) {
        for (const impl of this.getLangImpls(lang.name))
            Helpers.extend(lang, impl.implementation||{});
    }

    getInterfaceDefinitions() {
        return this.intefacesPkgs.map(x => x.definition).join("\n");
    }

    getLangNativeImpls(langName: string): PackageNativeImpl[] {
        let result = [];
        for (const pkg of this.implementationPkgs) {
            for (const impl of pkg.implementations.filter(x => x.language === langName)) {
                const fileNamePaths: { [name: string]: string } = {};
                for (const fileName of impl["native-includes"] || [])
                    fileNamePaths[fileName] = `native/${fileName}`;

                let incDir = impl["native-include-dir"];
                if (incDir) {
                    if (!incDir.endsWith("/")) incDir += "/";
                    const prefix = `native/${incDir}`;
                    for (const fn of Object.keys(pkg.content.files).filter(x => x.startsWith(prefix)).map(x => x.substr(prefix.length)))
                        fileNamePaths[fn] = `${prefix}${fn}`;
                }

                for (const fileName of Object.keys(fileNamePaths)) {
                    const path = fileNamePaths[fileName];
                    const code = pkg.content.files[path];
                    if (!code) throw new Error(`File '${fileName}' was not found for package '${pkg.implementationYaml.name}'`);
                    const impl = new PackageNativeImpl();
                    impl.pkgName = pkg.implementationYaml.name;
                    impl.pkgVendor = pkg.implementationYaml.vendor;
                    impl.pkgVersion = pkg.implementationYaml.version;
                    impl.fileName = fileName;
                    impl.code = code;
                    result.push(impl);
                }

            }
        }
        return result;
    }
}
