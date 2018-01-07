class MapX<K, V> {
  var value: V

  func set(key: K, value: V) -> Void {
      self.value = value
  }

  func get(key: K) -> V {
      return self.value
  }
}

class TestClass {
  func testMethod() -> Void {
      let mapX: MapX<String, Int>? = MapX()
      mapX!.set(key: "hello", value: 3)
      let numValue = mapX!.get(key: "hello2")
      print("\(numValue)")
  }
}

TestClass().testMethod()