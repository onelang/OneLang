export class List<T> {
    items: T[];

    add(item: T): void {
        this.items.push(item);
    }

    get(): T[] { return this.items; }
}