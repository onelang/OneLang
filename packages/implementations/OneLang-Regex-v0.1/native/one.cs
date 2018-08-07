using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

public class OneRegex
{
    public static string[] MatchFromIndex(string pattern, string input, int offset)
    {
        var match = new Regex($"\\G{pattern}").Match(input, offset);
        if (!match.Success) return null;
        var result = match.Groups.Cast<Group>().Select(g => g.Value).ToArray();
        return result;
    }
}
