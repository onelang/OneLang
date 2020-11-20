using One.Ast;

public class ReflectedValue
{
    public IType getDeclaredType() { return null; }
    public string getStringValue() { return null; }
    public bool getBooleanValue() { return false; }
    public ReflectedValue[] getArrayItems() { return null; }
    public string[] getMapKeys() { return null; }
    public object getUniqueIdentifier() { return null; }
    public IType getValueType() { return null; }
    public ReflectedValue getField(string name) { return null; }
    public string getEnumValueAsString() { return null; }
    public bool isNull() { return false; }
    public ReflectedValue getMapValue(string key) { return null; }
}