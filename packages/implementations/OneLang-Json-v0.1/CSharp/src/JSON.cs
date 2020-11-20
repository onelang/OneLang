using Newtonsoft.Json;

public static class JSON {
    public static string stringify(object obj) {
        return JsonConvert.SerializeObject(obj);
    }
}
