import java.util.HashMap;

class MapTestClass {
    public void mapTest() throws Exception
    {
        HashMap<String, Integer> map_obj = new HashMap<String, Integer>();
        map_obj.put("x", 5);
        //let containsX = "x" in mapObj;
        //delete mapObj["x"];
        map_obj.put("x", 3);
        return map_obj.get("x");
    }
}