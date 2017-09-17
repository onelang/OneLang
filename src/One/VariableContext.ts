import { OneAst as one } from "./Ast";

export class VariableContext {
    variables: { [name: string]: one.VariableBase } = {};

    constructor(public parentContext: VariableContext = null) { }

    log(data: string) {
        console.log(`[VariableContext] ${data}`);
    }

    inherit() {
        return new VariableContext(this);
    }

    add(variable: one.VariableBase) {
        if (variable.name in this.variables)
            this.log(`Variable shadowing detected: ${variable.name}`);

        this.variables[variable.name] = variable;
    }

    get(name: string): one.VariableBase {
        let currContext = <VariableContext> this;
        while (currContext !== null) {
            const result = currContext.variables[name];
            if (result)
                return result;
            currContext = currContext.parentContext;
        }

        return null;
    }
}
