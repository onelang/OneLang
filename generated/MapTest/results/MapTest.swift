class MapTestClass {
  func mapTest() -> Void {
      let mapObj: OneMap? = [
        "x": 5
      ]
      //let containsX = "x" in mapObj;
      //delete mapObj["x"];
      mapObj!["x"] = 3
      return mapObj!["x"]!
  }
}