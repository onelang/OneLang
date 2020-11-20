using System.Collections.Generic;
using System.Linq;

public static class Array {
    public static T[] from<T>(IEnumerable<T> obj) {
        return obj.ToArray();
    }
}
