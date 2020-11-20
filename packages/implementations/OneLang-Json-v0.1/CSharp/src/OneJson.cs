public static class OneJson {
    public static OneJValue parse(string content) { return null; }
}

public class OneJObject {
    public OneJValue get(string name) { return null; }
}

public class OneJValue {
    public string asString() { return null; }
    public long asNumber() { return 0; }
    public bool asBool() { return false; }
    public OneJObject asObject() { return null; }
    public OneJValue[] getArrayItems() { return null; }
}