import { SourceFile, Method, IInterface } from "../Ast/Types";

export class FillParent {
    private static processMethod(method: Method, parent: IInterface) {
        method.parentInterface = parent;
        for (const param of method.parameters)
            param.parentMethod = method;
    }

    static processFile(file: SourceFile) {
        for (const imp of file.imports)
            imp.parentFile = file;

        for (const enum_ of Object.values(file.enums)) {
            enum_.parentFile = file;
            for (const value of enum_.values)
                value.parentEnum = enum_;
        }

        for (const intf of Object.values(file.interfaces)) {
            intf.parentFile = file;
            for (const method of Object.values(intf.methods))
                this.processMethod(method, intf);
        }

         for (const cls of Object.values(file.classes)) {
            cls.parentFile = file;
            
            if (cls.constructor_)
                cls.constructor_.parentClass = cls;

            for (const method of Object.values(cls.methods))
                this.processMethod(method, cls);

            for (const field of Object.values(cls.fields))
                field.parentClass = cls;

            for (const prop of Object.values(cls.properties))
                prop.parentClass = cls;
         }
   }
}