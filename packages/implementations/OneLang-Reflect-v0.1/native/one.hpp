#include <memory>
#include <fstream>
#include <vector>
#include <map>
#include <iostream>
#include <any>

class OneClass;

class ReflectedClass
{
  public:
    virtual ~ReflectedClass() { }
};

class OneReflectUtil {
  public:
    static std::string nameKey(const std::string& name) {
        std::string key = OneStringHelper::replace(name, "_", "");
        std::transform(key.begin(), key.end(), key.begin(), ::tolower);
        return key;
    }
};

typedef std::any (*OneFieldGetter)(one::sp<ReflectedClass> obj);
typedef void (*OneFieldSetter)(one::sp<ReflectedClass> obj, std::any value);

class OneField {
  public:
    one::sp<OneClass> cls;
    std::string name;
    bool isStatic;
    std::string type;

    OneFieldGetter getter;
    OneFieldSetter setter;

    OneField(const std::string& name, bool isStatic, const std::string& type, OneFieldGetter getter, OneFieldSetter setter)
        : name(name), isStatic(isStatic), type(type), getter(getter), setter(setter) { }

    std::any getValue(one::sp<ReflectedClass> obj) {
        return this->getter(obj);
    }

    void setValue(one::sp<ReflectedClass> obj, std::any value) {
        this->setter(obj, value);
    }
};

class OneMethodArgument {
  public:
    std::string name;
    std::string type;

    OneMethodArgument(const std::string& name, const std::string& type)
        : name(name), type(type) { }
};

typedef std::any (*OneMethodInvoker)(one::sp<ReflectedClass> obj, one::vec<std::any> args);

class OneMethod {
  public:
    one::sp<OneClass> cls;
    std::string name;
    bool isStatic;
    std::string returnType;
    std::vector<OneMethodArgument> args;
    OneMethodInvoker invoker;

    OneMethod(const std::string& name, bool isStatic, const std::string& returnType, const std::vector<OneMethodArgument>&& args, OneMethodInvoker invoker)
        : name(name), isStatic(isStatic), returnType(returnType), args(args), invoker(invoker) { }

    std::any call(one::sp<ReflectedClass> obj, one::vec<std::any> args) {
        return this->invoker(obj, args);
    }
};

class OneClass {
    public:
    std::string name;
    const std::type_info& typeInfo;
    std::map<std::string, one::sp<OneField>> fields;
    std::map<std::string, one::sp<OneMethod>> methods;

    OneClass(const std::string& name, const std::type_info& typeInfo)
        : name(name), typeInfo(typeInfo) { }

    OneClass& addMethod(one::sp<OneMethod> method) {
        this->methods[OneReflectUtil::nameKey(method->name)] = method;
        return *this;
    }

    OneClass& addField(one::sp<OneField> field) {
        this->fields[OneReflectUtil::nameKey(field->name)] = field;
        return *this;
    }

    one::sp<OneField> getField(const std::string& name) { return this->fields[OneReflectUtil::nameKey(name)]; }
    one::sp<OneMethod> getMethod(const std::string& name) { return this->methods[OneReflectUtil::nameKey(name)]; }

    one::vec<one::sp<OneField>> getFields() {
        one::vec<one::sp<OneField>> result;
        for(auto it = this->fields.begin(); it != this->fields.end(); ++it)
            result->push_back(it->second);
        return result;
    }

    one::vec<one::sp<OneMethod>> getMethods() {
        one::vec<one::sp<OneMethod>> result;
        for(auto it = this->methods.begin(); it != this->methods.end(); ++it)
            result->push_back(it->second);
        return result;
    }
};

class OneReflect {
  public:
    static std::map<std::string, one::sp<OneClass>> classesByName;
    static std::map<size_t, one::sp<OneClass>> classesByTypeHash;

    template <typename T>
    static one::sp<OneClass> getClass(one::sp<T> cls) {
        return classesByTypeHash[typeid(T).hash_code()];
    }

    static one::sp<OneClass> getClassByName(const std::string& name) {
        return classesByName[OneReflectUtil::nameKey(name)];
    }

    static OneClass& addClass(const std::string& name, const std::type_info& typeInfo) {
        auto oneClass = std::make_shared<OneClass>(name, typeInfo);
        classesByName[OneReflectUtil::nameKey(name)] = oneClass;
        classesByTypeHash[typeInfo.hash_code()] = oneClass;
        return *oneClass;
    }
};

std::map<std::string, one::sp<OneClass>> OneReflect::classesByName;
std::map<size_t, one::sp<OneClass>> OneReflect::classesByTypeHash;

std::string operator+(const std::string& str, const std::any& value) {
    try {
        auto& type = value.type();
        if (type == typeid(int)) {
            return str + std::to_string(std::any_cast<int>(value));
        } else if (type == typeid(std::string)) {
            return str + std::any_cast<std::string>(value);
        } else {
            return str + "std::any<" + type.name() + ">";
        }
    }
    catch(const std::exception& e) {
        std::cout << e.what() << '\n';
        return str;
    }
}