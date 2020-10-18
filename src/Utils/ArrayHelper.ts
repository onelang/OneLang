export class ArrayHelper {
    static sortBy<T>(items: T[], keySelector: (item: T) => number): T[] {
        // @java-import java.util.Arrays
        // @java Arrays.sort(items, (a, b) -> keySelector.apply(a) - keySelector.apply(b));
        // @java return items;
        return items.sort((a: T, b: T) => keySelector(a) - keySelector(b));
    }

    static removeLastN<T>(items: T[], count: number): void {
        // @java items.subList(items.size() - count, items.size()).clear();
        items.splice(items.length - count, count);
    }
}