package io.onelang.std.json;

import com.google.gson.*;

public class OneJObject {
    JsonObject value;

    public OneJObject(JsonObject value) {
        this.value = value;
    }

    public OneJValue get(String name) {
        return new OneJValue(this.value.get(name));
    }
}