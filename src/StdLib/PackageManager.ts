import { OneYaml, YamlValue } from "One.Yaml-v0.1";

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

export class InterfaceDependency {
    constructor(
        public name: string,
        // @csharp-type double
        public minver: number) { }
}

export class InterfaceYaml {
    constructor(
        // @csharp-type double
        public fileVersion: number,
        public vendor: string,
        public name: string,
        // @csharp-type double
        public version: number,
        public definitionFile: string,
        public dependencies: InterfaceDependency[]) { }

    static fromYaml(obj: YamlValue) {
        return new InterfaceYaml(obj.dbl("file-version"), obj.str("vendor"), obj.str("name"), obj.dbl("version"), obj.str("definition-file"),
            obj.arr("dependencies").map(dep => new InterfaceDependency(dep.str("name"), dep.dbl("minver"))));
    }
}

export class InterfacePackage {
    interfaceYaml: InterfaceYaml;
    definition: string;

    constructor(public content: PackageContent) {
        this.interfaceYaml = InterfaceYaml.fromYaml(OneYaml.load(content.files["interface.yaml"]));
        this.definition = content.files[this.interfaceYaml.definitionFile];
    }
}

export class ImplPkgImplIntf { 
    constructor(
        public name: string,
        // @csharp-type double
        public minver: number,
        // @csharp-type double
        public maxver: number) { }
}

export class ImplPkgImplementation {
    constructor(
        public interface_: ImplPkgImplIntf,
        public language: string,
        public nativeIncludes: string[],
        public nativeIncludeDir: string) { }
}

export class ImplPackageYaml {
    constructor(
        // @csharp-type double
        public fileVersion: number,
        public vendor: string,
        public name: string,
        public description: string,
        public version: string,
        public includes: string[],
        public implements_: ImplPkgImplementation[]) { }
    
    static fromYaml(obj: YamlValue) {
        return new ImplPackageYaml(obj.dbl("file-version"), obj.str("vendor"), obj.str("name"), obj.str("description"), obj.str("version"), obj.strArr("includes"),
            obj.arr("implements").map(impl => new ImplPkgImplementation(
                new ImplPkgImplIntf(impl.obj("interface").str("name"), impl.obj("interface").dbl("minver"), impl.obj("interface").dbl("maxver")),
                impl.str("language"), impl.strArr("native-includes"), impl.str("native-include-dir"))));
    }
}

export class ImplementationPackage {
    implementationYaml: ImplPackageYaml;
    implementations: ImplPkgImplementation[] = [];

    constructor(public content: PackageContent) {
        this.implementationYaml = ImplPackageYaml.fromYaml(Yaml.load(content.files["package.yaml"]));
        this.implementations = [];
        for (const impl of this.implementationYaml.implements_||[])
            this.implementations.push(impl);
        for (const include of this.implementationYaml.includes||[]) {
            const included = ImplPackageYaml.fromYaml(Yaml.load(content.files[include]));
            for (const impl of included.implements_)
                this.implementations.push(impl);
        }
    }
}

export class PackageManager {
    interfacesPkgs: InterfacePackage[] = [];
    implementationPkgs: ImplementationPackage[] = [];

    constructor(public source: PackageSource) { }

    async loadAllCached(): Promise<void> {
        const allPackages = await this.source.getAllCached();

        for (const content of allPackages.packages.filter(x => x.id.type === PackageType.Interface))
            this.interfacesPkgs.push(new InterfacePackage(content));

        for (const content of allPackages.packages.filter(x => x.id.type === PackageType.Implementation))
            this.implementationPkgs.push(new ImplementationPackage(content));
    }

    getLangImpls(langName: string): ImplPkgImplementation[] {
        const allImpls: ImplPkgImplementation[] = [];
        for (const pkg of this.implementationPkgs)
            for (const impl of pkg.implementations)
                allImpls.push(impl);
        return allImpls.filter(x => x.language === langName);
    }

    getInterfaceDefinitions() {
        return this.interfacesPkgs.map(x => x.definition).join("\n");
    }

    getLangNativeImpls(langName: string): PackageNativeImpl[] {
        let result: PackageNativeImpl[] = [];
        for (const pkg of this.implementationPkgs) {
            for (const pkgImpl of pkg.implementations.filter(x => x.language === langName)) {
                const fileNamePaths: { [name: string]: string } = {};
                for (const fileName of pkgImpl.nativeIncludes)
                    fileNamePaths[fileName] = `native/${fileName}`;

                let incDir = pkgImpl.nativeIncludeDir;
                if (incDir !== null) {
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
