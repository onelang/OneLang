using System.Linq;

public class MapTestClass
{
    public void MapTest()
    {
        var mapObj = new Dictionary<string, int>
        {
          { "x", 5 }
        };
        //let containsX = "x" in mapObj;
        //delete mapObj["x"];
        mapObj["x"] = 3;
        return mapObj["x"];
    }
}