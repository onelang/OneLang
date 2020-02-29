export class Linq<T> {
    constructor(public items: T[]) { }

    except(items: T[]) { return new Linq(this.items.filter(item => !items.includes(item))); }
    intersect(items: T[]) { return new Linq(this.items.filter(item => items.includes(item))); }

    selectMany<T2>(selector: (item: T) => T2[]) {
        return new Linq<T2>(this.items.reduce((acc, val) => acc.concat(new Linq(selector(val)).get()), []));
    }

    map<T2>(selector: (item: T, i: number) => T2) { return new Linq(this.items.map(selector)); }
    flat() { return new Linq(this.items.flat()); }
    take(count: number): Linq<T> { return new Linq(this.items.filter((_, i) => i < count)); }
    skip(count: number): Linq<T> { return new Linq(this.items.filter((_, i) => i >= count)); }
    join(separator: string) { return this.items.join(separator); }
    concat(arr2: T[]) { return this.items.concat(arr2); }

    get() { return this.items; }
    last() { return this.items[this.items.length - 1]; }
}
