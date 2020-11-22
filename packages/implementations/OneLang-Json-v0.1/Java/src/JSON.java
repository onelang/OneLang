package io.onelang.std.json;

import com.google.gson.*;

public class JSON {
    public static String stringify(Object obj) {
        Gson gson = new GsonBuilder().disableHtmlEscaping().create();
        String json = gson.toJson(obj);
        return json;
    }
}