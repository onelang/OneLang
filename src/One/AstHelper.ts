import { OneAst as one } from "./Ast";

export class AstHelper {
    static replaceProperties<T>(dest, src: T): T {
        dest.__proto__ = (<any>src).__proto__;

        for (var i in dest) 
            delete dest[i];

        for (var i of Object.keys(src)) 
            dest[i] = src[i];

        return dest;
    }

    static methodRepr(method: one.Method) {
        return `${method.parentRef.name}::${method.name}(${method.parameters.map(x => x.type.repr()).join(", ")})`;
    }

    static toJson(obj: any) {
        const json = JSON.stringify(obj, (k,v) => {
            if (k.endsWith("Ref")) {
                if (!v.metaPath) {
                    //console.log("Clone is not possible as metaPath is missing!");
                }

                return { metaPath: v.metaPath };
            } else {
                return v;
            }
        }, 4);

        return json;
    }

    static clone<T>(src: T): T {
        const json = AstHelper.toJson(src);
        const clone = <T>JSON.parse(json, (k,v) => {
            const type = v && v.$objType;
            if (type === "Type") {
                return one.Type.Load(v);
            } else if (type === "VariableRef") {
                return one.VariableRef.Load(v);
            }
            return v;
        });
        
        return clone;
    }
}
