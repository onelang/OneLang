using System.Linq;
using Newtonsoft.Json.Linq;

public static class OneJson {
    public static OneJValue parse(string content) { 
        var value = JToken.Parse(content);
        return new OneJValue(value);
    }
}

public class OneJObject {
    public JObject value;
    public OneJObject(JObject value) { this.value = value; }

    public OneJValue get(string name) { return new OneJValue((JToken) this.value[name]); }
}

public class OneJValue {
    public JToken value;

    public OneJValue(JToken value) { this.value = value; }

    public string asString() { return (string)this.value; }
    public long asNumber() { return (long)this.value; }
    public bool asBool() { return (bool)this.value; }
    public OneJObject asObject() { return new OneJObject((JObject) this.value); }
    public OneJValue[] getArrayItems() { return this.value.Children().Select(x => new OneJValue(x)).ToArray(); }
}