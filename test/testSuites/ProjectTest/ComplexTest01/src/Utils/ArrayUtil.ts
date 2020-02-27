export class ArrayUtil {
    static concat<T>(arr1: T[], arr2: T[]): T[] { 
        const result: T[] = [];
        for (const item of arr1)
            result.push(item);
        for (const item of arr2)
            result.push(item);
        return result;
    }
}