import java.util.HashMap;

class MapTestClass {
    public void mapTest() throws Exception
    {
        HashMap<String, Integer> mapObj = new HashMap<String, Integer>();
        mapObj.put("x", 5);
        //let containsX = "x" in mapObj;
        //delete mapObj["x"];
        mapObj.put("x", 3);
        return mapObj.get("x");
    }
}