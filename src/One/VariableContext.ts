import { OneAst as one } from "./Ast";

export class VariableContext<T> {
    variables: { [name: string]: T } = {};

    constructor(public parentContext: VariableContext<T> = null) { }

    log(data: string) {
        console.log(`[VariableContext] ${data}`);
    }

    inherit() {
        return new VariableContext(this);
    }

    add(name: string, value: T) {
        if (name in this.variables)
            this.log(`Variable shadowing detected: ${name}`);

        this.variables[name] = value;
    }

    get(name: string): T {
        let currContext = <VariableContext<T>> this;
        while (currContext !== null) {
            const result = currContext.variables[name];
            if (result)
                return result;
            currContext = currContext.parentContext;
        }

        return null;
    }
}
