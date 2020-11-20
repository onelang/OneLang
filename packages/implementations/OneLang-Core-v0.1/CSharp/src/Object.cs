using System.Collections.Generic;
using System.Linq;

public static class Object {
    public static string[] keys<TValue>(Dictionary<string, TValue> dict) {
        return dict.Select(x => x.Key).ToArray();
    }

    public static TValue[] values<TValue>(Dictionary<string, TValue> dict) {
        return dict.Select(x => x.Value).ToArray();
    }
}
