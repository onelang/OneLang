using System.Linq;
using System.Text.RegularExpressions;

public class RegExp {
    public string pattern;
    public string modifiers;
    public int lastIndex;
    public Match lastMatch;

    public RegExp(string pattern): this(pattern, null) { }

    public RegExp(string pattern, string modifiers) {
        this.pattern = pattern;
        this.modifiers = modifiers;
    }

    public string[] exec(string data) {
        this.lastMatch = this.lastMatch == null ? new Regex($"\\G(?:{this.pattern})").Match(data, this.lastIndex) : lastMatch.NextMatch();
        return this.lastMatch.Success ? this.lastMatch.Groups.Cast<Group>().Select(x => x.Value).ToArray() : null;
    }
}
