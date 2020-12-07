package io.onelang.std.json;

import com.google.gson.*;

public class OneJson {
    public static OneJValue parse(String content) {
        JsonParser parser = new JsonParser();
        JsonElement value = parser.parse(content);
        return new OneJValue(value);
    }
}