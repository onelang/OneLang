#include <memory>
#include <fstream>
#include <vector>
#include <map>
#include <iostream>
#include <experimental/any>

class OneClass;

class ReflectedClass
{
  public:
    virtual ~ReflectedClass() { }
};

class OneReflectUtil {
  public:
    static string nameKey(const string& name) {
        string key = OneStringHelper::replace(name, "_", "");
        std::transform(key.begin(), key.end(), key.begin(), ::tolower);
        return key;
    }
};

typedef any (*OneFieldGetter)(sp<ReflectedClass> obj);
typedef void (*OneFieldSetter)(sp<ReflectedClass> obj, any value);

class OneField {
  public:
    sp<OneClass> cls;
    string name;
    bool isStatic;
    string type;

    OneFieldGetter getter;
    OneFieldSetter setter;

    OneField(const string& name, bool isStatic, const string& type, OneFieldGetter getter, OneFieldSetter setter)
        : name(name), isStatic(isStatic), type(type), getter(getter), setter(setter) { }

    any getValue(sp<ReflectedClass> obj) {
        return this->getter(obj);
    }

    void setValue(sp<ReflectedClass> obj, any value) {
        this->setter(obj, value);
    }
};

class OneMethodArgument {
  public:
    string name;
    string type;

    OneMethodArgument(const string& name, const string& type)
        : name(name), type(type) { }
};

typedef any (*OneMethodInvoker)(sp<ReflectedClass> obj, vec<any> args);

class OneMethod {
  public:
    sp<OneClass> cls;
    string name;
    bool isStatic;
    string returnType;
    vector<OneMethodArgument> args;
    OneMethodInvoker invoker;

    OneMethod(const string& name, bool isStatic, const string& returnType, const vector<OneMethodArgument>&& args, OneMethodInvoker invoker)
        : name(name), isStatic(isStatic), returnType(returnType), args(args), invoker(invoker) { }

    any call(sp<ReflectedClass> obj, vec<any> args) {
        return this->invoker(obj, args);
    }
};

class OneClass {
    public:
    string name;
    const type_info& typeInfo;
    map<string, sp<OneField>> fields;
    map<string, sp<OneMethod>> methods;

    OneClass(const string& name, const type_info& typeInfo)
        : name(name), typeInfo(typeInfo) { }

    OneClass& addMethod(sp<OneMethod> method) {
        this->methods[OneReflectUtil::nameKey(method->name)] = method;
        return *this;
    }

    OneClass& addField(sp<OneField> field) {
        this->fields[OneReflectUtil::nameKey(field->name)] = field;
        return *this;
    }

    sp<OneField> getField(const string& name) { return this->fields[OneReflectUtil::nameKey(name)]; }
    sp<OneMethod> getMethod(const string& name) { return this->methods[OneReflectUtil::nameKey(name)]; }

    vec<sp<OneField>> getFields() {
        vec<sp<OneField>> result;
        for(auto it = this->fields.begin(); it != this->fields.end(); ++it)
            result->push_back(it->second);
        return result;
    }

    vec<sp<OneMethod>> getMethods() {
        vec<sp<OneMethod>> result;
        for(auto it = this->methods.begin(); it != this->methods.end(); ++it)
            result->push_back(it->second);
        return result;
    }
};

class OneReflect {
  public:
    static map<string, sp<OneClass>> classesByName;
    static map<size_t, sp<OneClass>> classesByTypeHash;

    static sp<OneClass> getClass(sp<ReflectedClass> cls) {
        return classesByTypeHash[typeid(*cls).hash_code()];
    }

    static sp<OneClass> getClassByName(const string& name) {
        return classesByName[OneReflectUtil::nameKey(name)];
    }

    static OneClass& addClass(const string& name, const type_info& typeInfo) {
        auto oneClass = make_shared<OneClass>(name, typeInfo);
        classesByName[OneReflectUtil::nameKey(name)] = oneClass;
        classesByTypeHash[typeInfo.hash_code()] = oneClass;
        return *oneClass;
    }
};

map<string, sp<OneClass>> OneReflect::classesByName;
map<size_t, sp<OneClass>> OneReflect::classesByTypeHash;

string operator+(const string& str, const any& value) {
    try {
        auto& type = value.type();
        if (type == typeid(int)) {
            return str + to_string(any_cast<int>(value));
        } else if (type == typeid(string)) {
            return str + any_cast<string>(value);
        } else {
            return str + "any<" + type.name() + ">";
        }
    }
    catch(const std::exception& e) {
        std::cout << e.what() << '\n';
        return str;
    }
}