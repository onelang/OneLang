package io.onelang.std.yaml;

import java.util.Map;
import java.util.Arrays;
import java.util.ArrayList;
import java.util.LinkedHashMap;

public class YamlValue {
    public Object value;

    public YamlValue(Object value) { 
        this.value = value;
    }

    public ValueType type() { 
        return 
            this.value == null ? ValueType.Null :
            this.value instanceof Boolean ? ValueType.Boolean :
            this.value instanceof Integer || this.value instanceof Float || this.value instanceof Double ? ValueType.Number :
            this.value instanceof String ? ValueType.String :
            ValueType.Object;
    }

    public String asStr() { return (String)this.value; }
    public Map<String, Object> asObj() { return (Map<String, Object>)this.value; }

    public YamlValue obj(String key) {
        return new YamlValue((Map<String, Object>) this.asObj().get(key));
    }

    public Double dbl(String key) {
        var value = this.asObj().get(key);
        if (value == null) return Double.NaN;
        return value instanceof Double ? (Double)value : (double)(int)value;
    }

    public String str(String key) {
        var value = this.asObj().get(key);
        return value == null ? null : value.toString();
    }
    
    public YamlValue[] arr(String key) {
        var value = this.asObj().get(key);
        if (value == null) return new YamlValue[0];
        return ((ArrayList<Map<String, Object>>) value).stream().map(x -> new YamlValue(x)).toArray(YamlValue[]::new);
    }

    public String[] strArr(String key) {
        var value = this.asObj().get(key);
        if (value == null) return new String[0];
        return ((ArrayList<String>) value).toArray(String[]::new);
    }

    public Map<String, YamlValue> dict(String key) {
        var value = this.asObj().get(key);
        var result = new LinkedHashMap<String, YamlValue>();
        if (value != null)
            ((Map<String, Object>) value).forEach((k, v) -> result.put(k, new YamlValue(v)));
        return result;
    }
}