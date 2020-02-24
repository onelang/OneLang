export class Linq<T> {
    constructor(public items: T[]) { }

    except(items: T[]) { return _(this.items.filter(item => !items.includes(item))); }
    intersect(items: T[]) { return _(this.items.filter(item => items.includes(item))); }

    selectMany<T2>(selector: (item: T) => T2[]|{ [key:string]: T2 }) {
        return _<T2>(this.items.reduce((acc, val) => acc.concat(_(selector(val)).get()), []));
    }

    map<T2>(selector: (item: T, i?: number) => T2) { return _(this.items.map(selector)); }
    flat() { return _(this.items.flat()); }
    take(count: number): Linq<T> { return _(this.items.filter((_, i) => i < count)); }
    skip(count: number): Linq<T> { return _(this.items.filter((_, i) => i >= count)); }
    concat(arr2: T[]) { return [...this.items, ...arr2]; }
    join(separator: string) { return this.items.join(separator); }

    get() { return this.items; }
    last() { return this.items[this.items.length - 1]; }
}

export function _<T>(items: T[]|{ [key:string]: T }): Linq<T> { return Array.isArray(items) ? new Linq(items) : new Linq(Object.values(items)); }