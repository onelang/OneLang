using System.IO;
using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;

public class YAML {
    public static T safeLoad<T>(string str) {
        return new DeserializerBuilder()
            .WithNamingConvention(HyphenatedNamingConvention.Instance)
            .IgnoreUnmatchedProperties()
            .Build()
            .Deserialize<T>(new StringReader(str));
    }
}
