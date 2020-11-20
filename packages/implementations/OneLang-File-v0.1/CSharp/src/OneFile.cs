using System;
using System.IO;
using System.Linq;

public static class OneFile 
{
    public static string[] listFiles(string directory, bool recursive) {
        var skipLen = directory.Length + (directory.EndsWith("/") ? 0 : 1);
        return Directory.GetFiles(directory, "*", SearchOption.AllDirectories).Select(x => x.Substring(skipLen)).OrderBy(x => x, StringComparer.Ordinal).ToArray();
    }

    public static string readText(string fn) {
        return File.ReadAllText(fn);
    }

    public static void writeText(string fn, string content) {
        new DirectoryInfo(Path.GetDirectoryName(fn)).Create();
        File.WriteAllText(fn, content);
    }

    public static void copy(string srcFn, string dstFn) {
        File.Copy(srcFn, dstFn);
    }
}
