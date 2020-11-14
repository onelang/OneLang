import { ClassType, EnumType, IInterfaceType, InterfaceType, TypeHelper } from "../Ast/AstTypes";
import { IType } from "../Ast/Interfaces";
import { Class, LiteralTypes, Package } from "../Ast/Types";
import { ReflectedValue } from "One.Reflect-v0.1";

export class JsonSerializer {
    circleDetector = new Map<any, string>();

    constructor(public litTypes: LiteralTypes) { }

    pad(str: string): string { return str.split(/\n/g).map(x => `    ${x}`).join('\n'); }

    serialize(obj: ReflectedValue): string {
        const declType = <IType>obj.getDeclaredType();
        if (obj.isNull()) {
            return "null";
        } else if (TypeHelper.equals(declType, this.litTypes.string)) {
            return JSON.stringify(obj.getStringValue());
        } else if (TypeHelper.equals(declType, this.litTypes.boolean)) {
            return obj.getBooleanValue() ? "true" : "false";
        } else if (TypeHelper.isAssignableTo(declType, this.litTypes.array)) {
            const items: string[] = [];
            for (const item of obj.getArrayItems())
                items.push(this.serialize(item));
            return items.length === 0 ? "[]" : `[\n${this.pad(items.join(",\n"))}\n]`;
        } else if (TypeHelper.isAssignableTo(declType, this.litTypes.map)) {
            const items: string[] = [];
            for (const key of obj.getMapKeys()) {
                const value = obj.getMapValue(key);
                items.push(`"${key}": ${this.serialize(value)}`);
            }
            return items.length === 0 ? "{}" : `{\n${this.pad(items.join(",\n"))}\n}`;
        } else if (declType instanceof ClassType || declType instanceof InterfaceType) {
            const rawValue = obj.getUniqueIdentifier();
            if (this.circleDetector.has(rawValue)) {
                return `{"$ref":"${this.circleDetector.get(rawValue)}"}`;
            }
            const id = `id_${this.circleDetector.size}`;
            this.circleDetector.set(rawValue, id);

            const valueType = <IType>obj.getValueType();
            const decl = (<IInterfaceType>declType).getDecl();

            const members: string[] = [];

            members.push(`"$id": "${id}"`);

            if (valueType !== null && !TypeHelper.equals(valueType, declType))
                members.push(`"$type": "${valueType.repr()}"`);

            for (const field of decl.fields.filter(x => !x.isStatic)) {
                if ("json-ignore" in field.attributes) continue;
                //console.log(`processing ${field.parentInterface.name}::${field.name}`);
                const value = obj.getField(field.name);
                const serializedValue = this.serialize(value);
                if (!["[]", "{}", "null", "false", '""'].includes(serializedValue))
                    members.push(`"${field.name}": ${serializedValue}`);
            }
            return members.length === 0 ? "{}" : `{\n${this.pad(members.join(",\n"))}\n}`;
        } else if (declType instanceof EnumType) {
            return `"${obj.getEnumValueAsString()}"`;
        }
        return '"<UNKNOWN-TYPE>"';
    }
}