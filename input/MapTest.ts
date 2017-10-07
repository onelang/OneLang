class MapTestClass {
    mapTest() {
        let mapObj = { x: 5 };
        const keys = Object.keys(mapObj);
        let containsX = "x" in mapObj;
        return containsX
    }
}
