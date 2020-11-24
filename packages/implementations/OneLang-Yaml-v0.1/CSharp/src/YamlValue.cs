using System.Collections.Generic;
using System.Linq;
using YamlDotNet.RepresentationModel;

public enum ValueType { Null, Boolean, Number, String, Array, Object }

public class YamlValue
{
    public YamlNode node;

    public YamlValue(YamlNode node)
    {
        this.node = node;
    }

    public ValueType type() { return ValueType.Null; }

    public string asStr() { return ((YamlScalarNode)this.node).Value; }

    public YamlMappingNode Map { get { return ((YamlMappingNode)this.node); } }
    
    public YamlValue obj(string key)
    { 
        return new YamlValue(this.Map[key]);
    }
    
    public double dbl(string key)
    {
        return this.Map.Children.TryGetValue(key, out var value) ? double.Parse(((YamlScalarNode)value).Value) : double.NaN;
    }
    
    public string str(string key)
    {
        return this.Map.Children.TryGetValue(key, out var value) ? ((YamlScalarNode)value).Value : null;
    }

    public Dictionary<string, YamlValue> dict(string key)
    { 
        return this.Map.Children.TryGetValue(key, out var value)
            ? ((YamlMappingNode)value).Children.ToDictionary(x => ((YamlScalarNode)x.Key).Value, x => new YamlValue(x.Value))
            : new Dictionary<string, YamlValue>();
    }
    
    public YamlValue[] arr(string key)
    {
        return this.Map.Children.TryGetValue(key, out var value) ? 
            ((YamlSequenceNode)this.node[key]).Cast<YamlNode>().Select(x => new YamlValue(x)).ToArray() : new YamlValue[0];
    }
    
    public string[] strArr(string key) 
    {
        return this.Map.Children.TryGetValue(key, out var value) ? 
            ((YamlSequenceNode)this.Map[key]).Cast<YamlScalarNode>().Select(x => x.Value).ToArray() : new string[0];
    }
}
