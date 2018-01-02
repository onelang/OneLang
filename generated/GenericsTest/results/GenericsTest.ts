class MapX {
  set(key: , value: ) {
  }
  
  get(key: ) {
    return null;
  }
}

class Main {
  test() {
    const map = new MapX();
    map.set("hello", 3);
    const num_value = map.get("hello2");
  }
}