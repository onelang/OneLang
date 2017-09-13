export class VariableContext<T> {
    variables: { [name: string]: T } = {};

    constructor(public parentContext: VariableContext<T> = null) { }

    inherit() {
        return new VariableContext<T>(this);
    }

    add(name: string, type: T) {
        this.variables[name] = type;
    }

    get(name: string): T {
        let currContext = <VariableContext<T>> this;
        while (currContext !== null) {
            const result = currContext.variables[name];
            if (result)
                return result;
            currContext = currContext.parentContext;
        }

        console.log(`[VariableContext] Variable not found: ${name}`);
        return null;
    }
}
