export class ArrayHelpers {
    static sortBy<T>(arr: T[], selector: (item: T) => any): T[] {
        return arr.sort((a,b) => {
            const aProp = selector(a);
            const bProp = selector(b);
            return aProp < bProp ? -1 : aProp > bProp ? +1 : 0;
        });
    }
}
