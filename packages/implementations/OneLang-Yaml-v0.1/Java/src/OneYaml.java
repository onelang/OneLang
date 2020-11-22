package io.onelang.std.yaml;

import org.yaml.snakeyaml.Yaml;
import java.util.Map;

public class OneYaml {
    public static YamlValue load(String content) {
        //console.log("loading YAML: '" + content.substring(0, 50).replace("\n", "\\n") + "'");
        Yaml yaml = new Yaml();
        Map<String, Object> obj = yaml.load(content);
        //System.out.println(obj);
        return new YamlValue(obj);
    }
}