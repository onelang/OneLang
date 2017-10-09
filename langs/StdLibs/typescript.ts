class OneConsole {
    static print(str: any) {
        console.log(str);
    }
}

class OneArray<T> {
    private items: T[];

    length: number;

    add(item: T) {
        this.items.push(item);
    }

    get(index: number) {
        return this.items[index];
    }

    set(index: number, value: T) {
        this.items[index] = value;
    }
}

class OneMap<K, V> {
    data: { [name: string]: V } = {};

    keys(): OneArray<K> {
        const arr = new OneArray<K>();
        for (const item of Object.keys(this.data))
            arr.add(<K><any>item);
        return arr;
    }

    values(): OneArray<V> {
        const arr = new OneArray<V>();
        for (const item of Object.values(this.data))
        arr.add(<V><any>item);
        return arr;
    }

    hasKey(keyName: string): boolean {
        return keyName in this.data;
    }
}
