using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

public static class ExtensionMethods
{
    public static bool startsWith(this string str, string v)
    {
        return str.StartsWith(v);
    }
    
    public static bool endsWith(this string str, string v)
    {
        return str.EndsWith(v);
    }

    public static string substr(this string str, int offs, int len)
    {
        return offs + len > str.Length ? str.Substring(offs) : str.Substring(offs, len);
    }

    public static string substr(this string str, int offs)
    {
        if (offs >= str.Length) return "";
        return str.Substring(offs);
    }

    public static string substring(this string str, int offs, int end)
    {
        return str.Substring(offs, end - offs);
    }

    public static int length(this string str)
    {
        return str.Length;
    }

    public static bool includes(this string str, string substr)
    {
        return str.Contains(substr);
    }

    public static string replace(this string str, string from, string to)
    {
        return str.Replace(from, to);
    }

    public static string replace(this string str, RegExp from, string to)
    {
        return Regex.Replace(str, from.pattern, to);
    }

    public static T2[] map<T, T2>(this List<T> items, Func<T, T2> converter)
    {
        return items.Select(converter).ToArray();
    }

    public static T2[] map<T, T2>(this T[] items, Func<T, T2> converter)
    {
        return items.Select(converter).ToArray();
    }

    public static T find<T>(this IEnumerable<T> items, Func<T, bool> filter)
    {
        return items.FirstOrDefault(filter);
    }

    public static T[] filter<T>(this IEnumerable<T> items, Func<T, bool> filter)
    {
        return items.Where(filter).ToArray();
    }

    public static bool some<T>(this IEnumerable<T> items, Func<T, bool> filter)
    {
        return items.Any(filter);
    }

    public static bool every<T>(this IEnumerable<T> items, Func<T, int, bool> filter)
    {
        return !items.Where((x, i) => !filter(x, i)).Any();
    }

    public static string join(this string[] items, string separator)
    {
        return String.Join(separator, items);
    }

    public static string join(this List<string> items, string separator)
    {
        return String.Join(separator, items);
    }

    public static T get<T>(this List<T> items, int idx){
        return items[idx];
    }

    public static T get<T>(this T[] items, int idx){
        return items[idx];
    }

    public static void set<T>(this List<T> items, int idx, T value){
        items[idx] = value;
    }

    public static void set<T>(this T[] items, int idx, T value){
        items[idx] = value;
    }

    public static void push<T>(this List<T> items, T newItem){
        items.Add(newItem);
    }

    public static string get(this string str, int idx){
        return "" + str[idx];
    }

    public static bool startsWith(this string str, string substr, int idx)
    {
        return String.Compare(str, idx, substr, 0, substr.Length) == 0;
    }

    public static string toUpperCase(this string str)
    {
        return str.ToUpper();
    }

    public static int length<T>(this List<T> array)
    {
        return array.Count;
    }

    public static int length<T>(this T[] array)
    {
        return array.Length;
    }

    public static string repeat(this string str, int count)
    {
        var sb = new StringBuilder(str.Length * count);
        for (int i = 0; i < count; i++)
            sb.Append(str);
        return sb.ToString();
    }

    public static T shift<T>(this List<T> items)
    {
        var result = items[0];
        items.RemoveAt(0);
        return result;
    }

    public static TValue get<TKey, TValue>(this Dictionary<TKey, TValue> dict, TKey key)
    {
        return dict.GetValueOrDefault(key);
    }

    public static void set<TKey, TValue>(this Dictionary<TKey, TValue> dict, TKey key, TValue value)
    {
        dict[key] = value;
    }

    public static T pop<T>(this List<T> items)
    {
        var idx = items.Count - 1;
        var result = items[idx];
        items.RemoveAt(idx);
        return result;
    }

    public static bool includes<T>(this List<T> items, T item)
    {
        return items.IndexOf(item) !=  -1;
    }

    public static bool includes<T>(this T[] items, T item) where T: class
    {
        return items.Any(x => Object.Equals(x, item));
    }

    public static List<string> split(this string str, RegExp separator)
    {
        return new Regex(separator.pattern).Split(str).ToList();
    }

    public static T[] concat<T>(this IEnumerable<T> items, IEnumerable<T> otherItems)
    {
        return items.Concat(otherItems).ToArray();
    }

    public static void splice<T>(this List<T> items, int offset, int count)
    {
        items.RemoveRange(offset, count);
    }

    class LambdaComparer<T> : IComparer<T>
   
   {
        public readonly Func<T, T, int> Comparer;

        public LambdaComparer(Func<T, T, int> comparer)
        {
            Comparer = comparer;
        }

        public int Compare(T x, T y)
       
       {
            return this.Comparer(x, y);
        }
    }

    public static T[] sort<T>(this IEnumerable<T> items, Func<T, T, int> comparer)
    {
        return items.OrderBy(x => x, new LambdaComparer<T>(comparer)).ToArray();
    }

    public static void sort(this List<string> items)
    {
        items.Sort(StringComparer.OrdinalIgnoreCase);
    }

    public static bool hasKey<TKey, TValue>(this Dictionary<TKey, TValue> dict, TKey key)
    {
        return dict.ContainsKey(key);
    }

    public static int indexOf(this string str, string substr, int offset)
    {
        return str.IndexOf(substr, offset);
    }

    public static int lastIndexOf(this string str, string substr, int offset)
    {
        return str.LastIndexOf(substr, offset);
    }

    public static int charCodeAt(this string str, int offset)
    {
        return (int)str[offset];
    }

    public static string toLowerCase(this string str)
    {
        return str.ToLower();
    }
}