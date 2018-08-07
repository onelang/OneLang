using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

public class OneReflect
{
    public static Dictionary<string, OneClass> PublishedTypes = new Dictionary<string, OneClass>(StringComparer.OrdinalIgnoreCase);

    public static OneClass GetClass(object obj) => GetClassByName(obj.GetType().Name);
    public static OneClass GetClassByName(string name) => PublishedTypes.GetValueOrDefault(name);
    public static void Publish(Type type) => PublishedTypes[type.Name] = new OneClass(type);
}

public class OneClass
{
    public Type Native { get; set; }

    public string Name => Native.Name;
    public static Dictionary<string, OneField> Fields;
    public static Dictionary<string, OneMethod> Methods;

    public OneClass(Type native)
    {
        Native = native;
        Fields = native.GetFields().Select(x => new OneField(x)).ToDictionary(x => x.Name, StringComparer.OrdinalIgnoreCase);
        Methods = native.GetMethods().Select(x => new OneMethod(x)).ToDictionary(x => x.Name, StringComparer.OrdinalIgnoreCase);
    }

    public OneField GetField(string name) => Fields.GetValueOrDefault(name);
    public OneMethod GetMethod(string name) => Methods.GetValueOrDefault(name);
    public List<OneField> GetFields() => Fields.Values.ToList();
    public List<OneMethod> GetMethods() => Methods.Values.ToList();
}

public class OneField
{
    public FieldInfo Native { get; set; }

    public string Name => Native.Name;
    public bool IsStatic => Native.IsStatic;

    public OneField(FieldInfo native)
    {
        Native = native;
    }

    public object GetValue(object obj) => Native.GetValue(obj);
    public void SetValue(object obj, object value) => Native.SetValue(obj, value);
}

public class OneMethod
{
    public MethodInfo Native { get; set; }

    public string Name => Native.Name;
    public bool IsStatic => Native.IsStatic;

    public OneMethod(MethodInfo native)
    {
        Native = native;
    }

    public object Call(object obj, object[] args) => Native.Invoke(obj, args);
}
