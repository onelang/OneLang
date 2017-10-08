class MapTestClass {
    mapTest() {
        let mapObj = { x: 5 };
        let containsX = "x" in mapObj;
        delete mapObj["x"];
        mapObj["x"] = 3;
        const xVal = mapObj["x"];
        return containsX
    }
}
