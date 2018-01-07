class MapX {
  value: V;

  set(key: K, value: V) {
    this.value = value;
  }
  
  get(key: K) {
    return this.value;
  }
}

class TestClass {
  testMethod() {
    const mapX = new MapX();
    mapX.set("hello", 3);
    const numValue = mapX.get("hello2");
    console.log(`${numValue}`);
  }
}

try {
  new TestClass().testMethod();
} catch(e) {
  console.log(`Exception: ${e.message}`);
}