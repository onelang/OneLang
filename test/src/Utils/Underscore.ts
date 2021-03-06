export class Linq<T> {
    constructor(public items: T[]) { }

    except(items: T[]) { return new Linq(this.items.filter(item => !items.includes(item))); }
    intersect(items: T[]) { return new Linq(this.items.filter(item => items.includes(item))); }

    selectMany<T2>(selector: (item: T) => T2[]): Linq<T2> {
        return new Linq<T2>(this.items.reduce((acc, val) => acc.concat(new Linq(selector(val)).get()), <T2[]>[]));
    }

    map<T2>(selector: (item: T, i: number) => T2) { return new Linq(this.items.map(selector)); }
    //flat() { return new Linq(this.items.flat()); }
    take(count: number): Linq<T> { return new Linq(this.items.filter((_, i) => i < count)); }
    skip(count: number): Linq<T> { return new Linq(this.items.filter((_, i) => i >= count)); }
    join(separator: string) { return this.items.join(separator); }
    concat(arr2: T[]) { return new Linq(this.items.concat(arr2)); }

    toObject(keySelector: (item: T) => string) { 
        const result: { [key: string]: T } = { };
        for (const item of this.items)
            result[keySelector(item)] = item;
        return result;
    }

    toMap(keySelector: (item: T) => string) { 
        const result = new Map<string, T>();
        for (const item of this.items)
            result.set(keySelector(item), item);
        return result;
    }

    get(): T[] { return this.items; }
    last(): T { return this.items[this.items.length - 1]; }
}
