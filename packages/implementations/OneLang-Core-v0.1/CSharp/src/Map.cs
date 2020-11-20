using System.Collections.Generic;
using System.Linq;

public class Map<TKey, TValue> {
    Dictionary<TKey, TValue> items = new Dictionary<TKey, TValue>();

    public TValue get(TKey key)
    {
        return items.GetValueOrDefault(key);
    }

    public void set(TKey key, TValue value)
    {
        items[key] = value;
    }

    public void delete(TKey key)
    {
        items.Remove(key);
    }

    public bool has(TKey key)
    {
        return items.ContainsKey(key);
    }

    public TValue[] values()
    {
        return items.Values.ToArray();
    }

    public int size()
    {
        return items.Count;
    }
}
