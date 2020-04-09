export class ArrayHelper {
    static sortBy<T>(items: T[], keySelector: (item: T) => number): T[] {
        return items.sort((a: T, b: T) => keySelector(a) - keySelector(b));
    }

    static removeLastN<T>(items: T[], count: number): void {
        items.splice(items.length - count, count);
    }
}