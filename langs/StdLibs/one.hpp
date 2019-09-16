#include <memory>
#include <fstream>
#include <vector>
#include <map>
#include <iostream>
#include <regex>
#include <any>

using namespace std;

template <typename T>
using sp = shared_ptr<T>;

template <typename T>
using vec = sp<vector<T>>;

template<class Key, class T>
std::shared_ptr<std::map<Key,T>> make_shared_map(std::initializer_list<typename std::map<Key,T>::value_type> il)
{
    return std::make_shared<std::map<Key,T>>(il);
}

class OneMapHelper {
  public:
    template<typename K, typename V>
    static vec<K> keys(const sp<map<K,V>>& map) {
        vec<K> result = make_shared<vector<K>>();
        for(auto it = map->begin(); it != map->end(); ++it)
            result->push_back(it->first);
        return result;
    }

    template<typename K, typename V>
    static vec<V> values(const sp<map<K,V>>& map) {
        vec<V> result = make_shared<vector<V>>();
        for(auto it = map->begin(); it != map->end(); ++it)
            result->push_back(it->second);
        return result;
    }
};

class OneStringHelper {
  public:
    static vec<string> split(const string& str, const string& delim)
    {
        vec<string> tokens;
        
        size_t prev = 0, pos = 0;
        do
        {
            pos = str.find(delim, prev);
            if (pos == string::npos) pos = str.length();
            string token = str.substr(prev, pos - prev);
            tokens->push_back(token);
            prev = pos + delim.length();
        }
        while (pos < str.length() && prev < str.length());

        return tokens;
    }

    static string replace(const string& str, const string& from, const string& to) {
        if(from.empty()) return "";

        string result = str;
        size_t start_pos = 0;
        while((start_pos = result.find(from, start_pos)) != string::npos) {
            result.replace(start_pos, from.length(), to);
            start_pos += to.length(); // In case 'to' contains 'from', like replacing 'x' with 'yx'
        }
        return result;
    }
};

class OneFile {
  public:
    static string readText(const string& path)
    {
        ifstream file(path);
        string content((istreambuf_iterator<char>(file)), istreambuf_iterator<char>());
        return content;
    }
};

class OneRegex {
  public:
    static vec<string> matchFromIndex(const string& pattern, const string& input, int offset) {
        smatch matches;
        if (!regex_search(input.begin() + offset, input.end(), matches, regex("^" + pattern)))
            return nullptr;

        auto result = make_shared<vector<string>>();
        for(auto match : matches)
            result->push_back(match.str());
        return result;
    }
};

//===------------------ REFLECTION ------------------===//

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