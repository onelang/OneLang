import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.TreeMap;
import java.lang.reflect.*;

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
