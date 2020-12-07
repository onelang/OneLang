package io.onelang.std.json;

import com.google.gson.*;

public class OneJValue {
    public JsonElement value;

    public OneJValue(JsonElement value) {
        this.value = value;
    }

    public String asString() { return this.value.getAsString(); }
    public long asNumber() { return this.value.getAsLong(); }
    public Boolean asBool() { return this.value.getAsBoolean(); }
    public OneJObject asObject() { return new OneJObject(this.value.getAsJsonObject()); }
    
    public OneJValue[] getArrayItems() {
        JsonArray arr = this.value.getAsJsonArray();
        OneJValue[] result = new OneJValue[arr.size()];
        for (int i = 0; i < arr.size(); i++)
            result[i] = new OneJValue(arr.get(i));
        return result;
    }
}