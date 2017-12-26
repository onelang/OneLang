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
    public static Map<String, OneReflectClass> publishedTypes = new TreeMap<String, OneReflectClass>(String.CASE_INSENSITIVE_ORDER);

    public static OneReflectClass getClass(Object obj) {
        return getClassByName(obj.getClass().getName());
    }

    public static OneReflectClass getClassByName(String name) {
        return publishedTypes.get(name);
    }
    
    public static void publish(Class clazz) {
        publishedTypes.put(clazz.getName(), new OneReflectClass(clazz));
    }
}

class OneReflectClass
{
    public Class clazz;
    public String name;

    public static Map<String, OneReflectField> fields = new TreeMap<String, OneReflectField>(String.CASE_INSENSITIVE_ORDER);
    public static Map<String, OneReflectMethod> methods = new TreeMap<String, OneReflectMethod>(String.CASE_INSENSITIVE_ORDER);

    public OneReflectClass(Class clazz)
    {
        this.clazz = clazz;
        this.name = clazz.getName();

        for (Field field : clazz.getDeclaredFields()) {
            OneReflectField oneField = new OneReflectField(field);
            this.fields.put(oneField.name, oneField);
        } 

        for (Method method : clazz.getDeclaredMethods()) {
            OneReflectMethod oneMethod = new OneReflectMethod(method);
            this.methods.put(oneMethod.name, oneMethod);
        } 
    }

    public OneReflectField getField(String name) {
        return fields.get(name);
    }

    public OneReflectMethod getMethod(String name) {
        return methods.get(name);
    }
    
    public List<OneReflectField> getFields() {
        return new ArrayList(fields.values());
    }

    public List<OneReflectMethod> getMethods() {
        return new ArrayList(methods.values());
    }
}

class OneReflectField
{
    public Field field;

    public String name;
    public boolean isStatic;

    public OneReflectField(Field field)
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

class OneReflectMethod
{
    public Method method;

    public String name;
    public boolean isStatic;

    public OneReflectMethod(Method method)
    {
        this.method = method;
        this.name = method.getName();
        this.isStatic = Modifier.isStatic(method.getModifiers());
    }

    public Object call(Object obj, List<Object> args) throws Exception {
        return method.invoke(obj, args.toArray(new Object[args.size()]));
    }
}
