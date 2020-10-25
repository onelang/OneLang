import { Package, Class, Interface } from "../Ast/Types";
import { ITransformer } from "../ITransformer";

export class CollectInheritanceInfo implements ITransformer {
    name = "CollectInheritanceInfo";

    constructor() {
        // C# fix
        this.name = "CollectInheritanceInfo";
    }
    
    visitClass(cls: Class) {
        const allBaseIIntfs = cls.getAllBaseInterfaces();
        const intfs = allBaseIIntfs.map(x => x instanceof Interface ? x : null).filter(x => x !== null);
        const clses = allBaseIIntfs.map(x => x instanceof Class ? x : null).filter(x => x !== null && x !== cls);

        for (const field of cls.fields)
            field.interfaceDeclarations = intfs.map(x => x.fields.find(f => f.name === field.name) || null).filter(x => x !== null);

        for (const method of cls.methods) {
            method.interfaceDeclarations = intfs.map(x => x.methods.find(m => m.name === method.name) || null).filter(x => x !== null);
            method.overrides = clses.map(x => x.methods.find(m => m.name === method.name) || null).find(x => x !== null) || null;
            if (method.overrides !== null)
                method.overrides.overriddenBy.push(method);
        }
    }

    visitPackage(pkg: Package): void {
        for (const file of Object.values(pkg.files))
            for (const cls of file.classes)
                this.visitClass(cls);
    }
}