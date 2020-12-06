using System.IO;
using YamlDotNet.RepresentationModel;

public class OneYaml {
    public static YamlValue load(string content)
    {
        var yaml = new YamlStream();
        yaml.Load(new StringReader(content));
        return new YamlValue((YamlMappingNode)yaml.Documents[0].RootNode);
    }
}