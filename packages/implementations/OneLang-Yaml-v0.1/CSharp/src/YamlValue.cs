using System.Collections.Generic;
using System.Linq;
using YamlDotNet.RepresentationModel;

public class YamlValue {
    public YamlMappingNode node;

    public YamlValue(YamlMappingNode node) { this.node = node; }
    public YamlValue obj(string key) { return new YamlValue((YamlMappingNode) this.node[key]); }
    public double dbl(string key) { return this.node.Children.TryGetValue(key, out var value) ? double.Parse(((YamlScalarNode)value).Value) : double.NaN; }
    public string str(string key) { return this.node.Children.TryGetValue(key, out var value) ? ((YamlScalarNode)value).Value : null; }
    public Dictionary<string, YamlValue> dict(string key) { 
        return this.node.Children.TryGetValue(key, out var value)
            ? ((YamlMappingNode)value).Children.ToDictionary(x => ((YamlScalarNode)x.Key).Value, x => new YamlValue((YamlMappingNode)x.Value))
            : new Dictionary<string, YamlValue>();
    }
    
    public YamlValue[] arr(string key)
    {
        return this.node.Children.TryGetValue(key, out var value) ? 
            ((YamlSequenceNode)this.node[key]).Cast<YamlMappingNode>().Select(x => new YamlValue(x)).ToArray() : new YamlValue[0];
    }
    
    public string[] strArr(string key) 
    {
        return this.node.Children.TryGetValue(key, out var value) ? 
            ((YamlSequenceNode)this.node[key]).Cast<YamlScalarNode>().Select(x => x.Value).ToArray() : new string[0];
    }
}
