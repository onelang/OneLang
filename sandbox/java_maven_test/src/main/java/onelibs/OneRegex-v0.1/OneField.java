import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.TreeMap;
import java.lang.reflect.*;

public class OneField
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