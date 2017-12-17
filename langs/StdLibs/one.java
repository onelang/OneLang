import java.util.regex.Matcher;
import java.util.regex.Pattern;

class OneRegex {
    public static List<String> matchFromIndex(String pattern, String input, int offset) {
        Pattern patternObj = Pattern.compile("\\G" + pattern);
        Matcher matcher = patternObj.matcher(input);
        matcher.find(offset);

        List<String> result = new ArrayList();
        result.add(matcher.group());
        for (int i = 0; i < matcher.groupCount(); i++)
            result.add(matcher.group(i));
        return result;
    }
}
