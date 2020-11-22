package io.onelang.std.core;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class RegExp {
    String pattern;
    String modifiers;
    public Integer lastIndex;

    public RegExp(String pattern) { this(pattern, null); }
    public RegExp(String pattern, String modifiers) {
        this.lastIndex = 0;
        this.pattern = pattern;
        this.modifiers = modifiers;
    }

    public String[] exec(String data) {
        //System.out.println("matching '" + data.substring(this.lastIndex, Math.min(this.lastIndex + 30, data.length())).replace("\n", "\\n") + "' with pattern '" + this.pattern + "' from index " + this.lastIndex);
        var pattern = Pattern.compile("\\G(?:" + this.pattern + ")");
        var matcher = pattern.matcher(data);
        if (!matcher.find(this.lastIndex)) return null;
        this.lastIndex = matcher.end();
        var result = new String[matcher.groupCount() + 1];
        for (int i = 0; i <= matcher.groupCount(); i++)
            result[i] = matcher.group(i);
        //System.out.println(" => found match: '" + result[0] + "'");
        return result;
    }
}