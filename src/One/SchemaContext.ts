import { SchemaTransformer } from "./SchemaTransformer";
import { OneAst as one } from "./Ast";
import { Context as TiContext } from "./Transforms/ResolveIdentifiersTransform";
import { LangFileSchema } from "../Generator/LangFileSchema";

export class SchemaContext {
    arrayType: string;
    mapType: string;
    transformer: SchemaTransformer;
    tiContext = new TiContext();
    stdlib: SchemaContext;
    overlay: SchemaContext;

    constructor(public schema: one.Schema, public schemaType: "program"|"overlay"|"stdlib") {
        this.transformer = SchemaTransformer.instance;
    }

    log(msg: string) {
        console.log(`[SchemaContext] ${msg}`);
    }

    ensureTransforms(...transformNames: string[]) {
        this.transformer.ensure(this, ...transformNames);
    }

    addDependencySchema(schemaCtx: SchemaContext) {
        if (schemaCtx.schemaType === "stdlib") {
            this.stdlib = schemaCtx;
        } else if (schemaCtx.schemaType === "overlay") {
            this.overlay = schemaCtx;
        } else {
            throw new Error("Only overlay and stdlib schemas are allowed as dependencies!");
        }

        for (const glob of Object.values(schemaCtx.schema.globals))
            this.tiContext.addLocalVar(glob);
        
        for (const cls of Object.values(schemaCtx.schema.classes)) {
            cls.meta = cls.meta || {};
            cls.meta[schemaCtx.schemaType] = true; // TODO: move this logic to somewhere else?
        }
    }

    getInterfaces(...rootIntfNames: string[]): one.Interface[] {
        const todo = [...rootIntfNames];
        const seen: { [intfName: string]: boolean } = { };
        for (const item of rootIntfNames)
            seen[item] = true;
        const result: one.Interface[] = [];
        
        while (todo.length > 0) {
            const intfName = todo.shift();
            const intf = this.getClassOrInterface(intfName, intfName !== rootIntfNames[0]);
            if (!intf) continue;
            result.push(intf);

            for (const baseIntfName of intf.baseInterfaces) {
                if (seen[baseIntfName]) continue;
                seen[baseIntfName] = true;
                todo.push(baseIntfName);
            }
        }

        return result;
    }

    getFullChain(className: string): one.Interface[] {
        return [...this.getClassChain(className), ...this.getInterfaces(className)];
    }

    getMethod(className: string, methodName: string) {
        let intfs = this.getInterfaces(className);
        if (intfs.length === 0) // 'className' is a class
            intfs = this.getClassChain(className);

        for (const intf of intfs) {
            const method = intf.methods[methodName];
            if (method) return method;
        }
        return null;
    }

    getFieldOrProp(className: string, fieldName: string) {
        const classChain = this.getClassChain(className);
        for (const cls of classChain) {
            const fieldOrProp = cls.fields[fieldName] || cls.properties[fieldName];
            if (fieldOrProp) return fieldOrProp;
        }
        return null;
    }

    findBaseClass(className1: string, className2: string): one.Type {
        const chain1 = this.getClassChain(className1);
        const chain2 = this.getClassChain(className2);
        const intfs1 = this.getInterfaces(...chain1.map(x => x.name)).filter(x => x.type.isInterface);
        const intfs2 = this.getInterfaces(...chain2.map(x => x.name)).filter(x => x.type.isInterface);
        for (const item1 of intfs1)
            if (intfs2.some(item2 => item2.name === item1.name))
                return item1.type;
        return null;
    }

    getClass(name: string, required = false): one.Class {
        const result = this.schema.classes[name] || (this.overlay && this.overlay.schema.classes[name]) || (this.stdlib && this.stdlib.schema.classes[name]);
        if (required && !result)
            this.log(`Class was not found: ${name}`);
        return result;
    }

    getInterface(intfName: string, required = false): one.Interface {
        const result = this.schema.interfaces[intfName] || null;
        if (required && !result)
            this.log(`Interface was not found: ${intfName}`);
        return result;
    }

    getClassOrInterface(className: string, required = true): one.Interface {
        const intf = this.getInterface(className);
        if (intf) return intf;

        const cls = this.getClass(className);
        if (cls) return cls;

        if (required)
            this.log(`Class or interface is not found: ${className}`);

        return null;
    }

    getClassChain(className: string): one.Class[] {
        const result: one.Class[] = [];

        let currClass = className;
        while (currClass) {
            const cls = this.getClass(currClass, currClass !== className);
            result.push(cls);
            currClass = cls.baseClass;
        }

        return result;
    }
}