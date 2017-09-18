import { OneAst as one } from "./Ast";

export class AstHelper {
    static replaceProperties<T>(dest, src: T): T {
        for (var i in dest) 
            delete dest[i];

        for (var i of Object.keys(src)) 
            dest[i] = src[i];

        return dest;
    }

    static clone<T>(src: T): T {
        const json = JSON.stringify(src, (k,v) => {
            if (k.endsWith("Ref")) {
                if (!v.metaPath)
                    console.log("Clone is not possible as metaPath is missing!");
                return { metaPath: v.metaPath };
            } else {
                return v;
            }
        }, 4);
        
        const clone = <T>JSON.parse(json, (k,v) => {
            if (v.$objType === "Type")
                return one.Type.Load(v);
            return v;
        });
        
        return clone;
    }
}
