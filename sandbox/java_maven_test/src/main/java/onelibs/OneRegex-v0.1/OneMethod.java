import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.TreeMap;
import java.lang.reflect.*;

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
