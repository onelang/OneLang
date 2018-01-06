import { OneAst as one } from "./Ast";
import { LangFileSchema } from "../Generator/LangFileSchema";

export class AstHelper {
    static replaceProperties<T>(dest, src: T): T {
        const keep = ["node"];
        dest.__proto__ = (<any>src).__proto__;

        for (var i in dest)
            if (!keep.includes(i))
                delete dest[i];

        for (var i of Object.keys(src))
            if (!keep.includes(i))
                dest[i] = src[i];

        return dest;
    }

    static methodRepr(method: one.Method) {
        return `${method.classRef.name}::${method.name}(${method.parameters.map(x => x.type.repr()).join(", ")})`;
    }

    static toJson(obj: any) {
        const json = JSON.stringify(obj, (k,v) => {
            if (k.endsWith("Ref")) {
                if (!v.metaPath) {
                    //console.log("Clone is not possible as metaPath is missing!");
                }

                return { metaPath: v.metaPath, name: v.name };
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

    static getMethodFromRef(lang: LangFileSchema.LangFile, methodRef: one.MethodReference) {
        if (methodRef.methodRef.body)
            return methodRef.methodRef;

        const metaPath = methodRef.methodRef.metaPath;
        if (!metaPath) return null;

        const methodPathParts = metaPath.split("/");
        const cls = lang.classes[methodPathParts[0]];
        const method = cls && cls.methods && cls.methods[methodPathParts[1]];
        return method;
    }
}
