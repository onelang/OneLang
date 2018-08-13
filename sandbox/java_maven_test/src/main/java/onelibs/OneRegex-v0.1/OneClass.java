import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.TreeMap;
import java.lang.reflect.*;

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
        return new ArrayList<OneField>(fields.values());
    }

    public List<OneMethod> getMethods() {
        return new ArrayList<OneMethod>(methods.values());
    }
}
