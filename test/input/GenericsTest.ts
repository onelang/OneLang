class MapX<K, V> {
    value: V;
    set(key: K, value: V) { this.value = value; }
    get(key: K): V { return this.value; }
}

class TestClass {
    testMethod() {
        const mapX = new MapX<string, number>();
        mapX.set("hello", 3);
        const numValue = mapX.get("hello2");
        console.log(`${numValue}`);
    }
}