import { IInterface, Class } from "./Types";
import { InterfaceType, ClassType } from "./AstTypes";

export class AstHelper {
    static collectAllBaseInterfaces(intf: IInterface): IInterface[] {
        const result = new Set<IInterface>();
        const toBeProcessed: IInterface[] = [intf];

        while (toBeProcessed.length > 0) {
            const curr = toBeProcessed.pop();
            result.add(curr);

            if (curr instanceof Class && curr.baseClass !== null)
                toBeProcessed.push((<ClassType> curr.baseClass).decl);

            for (const baseIntf of curr.baseInterfaces)
                toBeProcessed.push((<InterfaceType> baseIntf).decl);
        }

        return Array.from(result.values());
    }
}