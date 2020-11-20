using System.Collections;
using System.Collections.Generic;
using System.Linq;

public class Set<T>: IEnumerable<T>
{
    HashSet<T> items;

    public Set() {
        items = new HashSet<T>();
    }

    public Set(IEnumerable<T> items) {
        this.items = new HashSet<T>(items);
    }

    public void add(T item) {
        items.Add(item);
    }

    public T[] values() {
        return items.ToArray();
    }

    IEnumerator IEnumerable.GetEnumerator()
    {
        return items.GetEnumerator();
    }

    public IEnumerator<T> GetEnumerator()
    {
        return items.GetEnumerator();
    }

    internal bool has(T item)
    {
        return this.items.Contains(item);
    }
}
