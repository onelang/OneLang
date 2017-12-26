using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text.RegularExpressions;

public class OneRegex
{
    public static string[] MatchFromIndex(string pattern, string input, int offset)
    {
        var match = new Regex($"\\G{pattern}").Match(input, offset);
        if (!match.Success) return null;
        var result = match.Groups.Cast<Group>().Select(g => g.Value).ToArray();
        return result;
    }
}

public class OneReflect
{
    public static Dictionary<string, OneReflectClass> PublishedTypes = new Dictionary<string, OneReflectClass>(StringComparer.OrdinalIgnoreCase);

    public static OneReflectClass GetClass(object obj) => GetClassByName(obj.GetType().Name);
    public static OneReflectClass GetClassByName(string name) => PublishedTypes.GetValueOrDefault(name);
    public static void Publish(Type type) => PublishedTypes[type.Name] = new OneReflectClass(type);
}

public class OneReflectClass
{
    public Type Native { get; set; }

    public string Name => Native.Name;
    public static Dictionary<string, OneReflectField> Fields;
    public static Dictionary<string, OneReflectMethod> Methods;

    public OneReflectClass(Type native)
    {
        Native = native;
        Fields = native.GetFields().Select(x => new OneReflectField(x)).ToDictionary(x => x.Name, StringComparer.OrdinalIgnoreCase);
        Methods = native.GetMethods().Select(x => new OneReflectMethod(x)).ToDictionary(x => x.Name, StringComparer.OrdinalIgnoreCase);
    }

    public OneReflectField GetField(string name) => Fields.GetValueOrDefault(name);
    public OneReflectMethod GetMethod(string name) => Methods.GetValueOrDefault(name);
    public List<OneReflectField> GetFields() => Fields.Values.ToList();
    public List<OneReflectMethod> GetMethods() => Methods.Values.ToList();
}

public class OneReflectField
{
    public FieldInfo Native { get; set; }

    public string Name => Native.Name;
    public bool IsStatic => Native.IsStatic;

    public OneReflectField(FieldInfo native)
    {
        Native = native;
    }

    public object GetValue(object obj) => Native.GetValue(obj);
    public void SetValue(object obj, object value) => Native.SetValue(obj, value);
}

public class OneReflectMethod
{
    public MethodInfo Native { get; set; }

    public string Name => Native.Name;
    public bool IsStatic => Native.IsStatic;

    public OneReflectMethod(MethodInfo native)
    {
        Native = native;
    }

    public object Call(object obj, object[] args) => Native.Invoke(obj, args);
}
