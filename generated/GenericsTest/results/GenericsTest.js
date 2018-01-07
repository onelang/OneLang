class MapX {
  set(key, value) {
    this.value = value;
  }
  
  get(key) {
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