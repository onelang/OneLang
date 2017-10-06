class MapX<K, V> {
    set(key: K, value: V) { }
    get(key: K): V { return null; }
}

class Main {
    test() {
        const map = new MapX<string, number>();
        map.set("hello", 3);
        const numValue = map.get("hello2");
    }
}