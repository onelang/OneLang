class MapX {
  func set(key: , value: ) -> Void {
  }

  func get(key: ) ->  {
      return nil
  }
}

class Main {
  func test() -> Void {
      let map: MapX? = MapX()
      map!.set(key: "hello", value: 3)
      let _ = map!.get(key: "hello2")
  }
}