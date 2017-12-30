import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.TreeMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.lang.reflect.*;

class OneRegex
{
    public static List<String> matchFromIndex(String pattern, String input, int offset) {
        Pattern patternObj = Pattern.compile("\\G" + pattern);
        Matcher matcher = patternObj.matcher(input);
        if (!matcher.find(offset))
            return null;

        List<String> result = new ArrayList();
        result.add(matcher.group());
        for (int i = 0; i < matcher.groupCount(); i++)
            result.add(matcher.group(i));
        return result;
    }
}

class OneReflect
{
    public static Map<String, OneClass> publishedTypes = new TreeMap<String, OneClass>(String.CASE_INSENSITIVE_ORDER);

    public static OneClass getClass(Object obj) {
        return getClassByName(obj.getClass().getName());
    }

    public static OneClass getClassByName(String name) {
        return publishedTypes.get(name);
    }
    
    public static void publish(Class clazz) {
        publishedTypes.put(clazz.getName(), new OneClass(clazz));
    }
}

class OneClass
{
    public Class clazz;
    public String name;

    public static Map<String, OneField> fields = new TreeMap<String, OneField>(String.CASE_INSENSITIVE_ORDER);
    public static Map<String, OneMethod> methods = new TreeMap<String, OneMethod>(String.CASE_INSENSITIVE_ORDER);

    public OneClass(Class clazz)
    {
        this.clazz = clazz;
        this.name = clazz.getName();

        for (Field field : clazz.getDeclaredFields()) {
            OneField oneField = new OneField(field);
            this.fields.put(oneField.name, oneField);
        } 

        for (Method method : clazz.getDeclaredMethods()) {
            OneMethod oneMethod = new OneMethod(method);
            this.methods.put(oneMethod.name, oneMethod);
        } 
    }

    public OneField getField(String name) {
        return fields.get(name);
    }

    public OneMethod getMethod(String name) {
        return methods.get(name);
    }
    
    public List<OneField> getFields() {
        return new ArrayList(fields.values());
    }

    public List<OneMethod> getMethods() {
        return new ArrayList(methods.values());
    }
}

class OneField
{
    public Field field;

    public String name;
    public boolean isStatic;

    public OneField(Field field)
    {
        this.field = field;
        this.name = field.getName();
        this.isStatic = Modifier.isStatic(field.getModifiers());
    }

    public Object getValue(Object obj) throws Exception {
        return field.get(obj);
    }

    public void setValue(Object obj, Object value) throws Exception {
        field.set(obj, value);
    }
}

class OneMethod
{
    public Method method;

    public String name;
    public boolean isStatic;

    public OneMethod(Method method)
    {
        this.method = method;
        this.name = method.getName();
        this.isStatic = Modifier.isStatic(method.getModifiers());
    }

    public Object call(Object obj, List<Object> args) throws Exception {
        return method.invoke(obj, args.toArray(new Object[args.size()]));
    }
}
