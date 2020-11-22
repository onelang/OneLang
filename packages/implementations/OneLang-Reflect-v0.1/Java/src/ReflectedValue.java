package io.onelang.std.reflect;

import OneLang.One.Ast.Interfaces.IType;

public class ReflectedValue
{
    public IType getDeclaredType() { return null; }
    public String getStringValue() { return null; }
    public Boolean getBooleanValue() { return false; }
    public ReflectedValue[] getArrayItems() { return null; }
    public String[] getMapKeys() { return null; }
    public Object getUniqueIdentifier() { return null; }
    public IType getValueType() { return null; }
    public ReflectedValue getField(String name) { return null; }
    public String getEnumValueAsString() { return null; }
    public Boolean isNull() { return false; }
    public ReflectedValue getMapValue(String key) { return null; }
}