import Foundation

public enum OneError : Error {
    case RuntimeError(String)
}

class OneRegex { 
    class func matchFromIndex(pattern: String, input: String, offset: Int) -> [String]? {
        let regex = try! NSRegularExpression(pattern: "^" + pattern)
        guard let match = regex.firstMatch(in: input, range: NSMakeRange(offset, input.utf16.count - offset)) else { return nil }
        
        var results = [String]()
        for i in 0 ... match.numberOfRanges - 1 {
            let range = match.range(at: i)
            let groupValue = input.substring(with: Range(range, in: input)!)
            results.append(groupValue)
        }        
        return results        
    }
}

class OneReflect {
    static var classes = [String: OneClass]()

    class func getClass(obj: Any?) -> OneClass? {
        let className = String(describing: type(of: obj!))
        return getClassByName(name: className)
    }

    class func getClassByName(name: String) -> OneClass? {
        return classes[nameKey(name)]
    }

    class func addClass(_ cls: OneClass) -> OneClass {
        classes[nameKey(cls.name)] = cls
        return cls
    }

    class func nameKey(_ name: String) -> String {
        return name.replacingOccurrences(of: "_", with: "").lowercased()
    }
}

class OneClass {
    var name: String
    var fields = [String: OneField]()
    var methods = [String: OneMethod]()

    init(name: String) {
        self.name = name
    }

    func getField(name: String) -> OneField? {
        return fields[OneReflect.nameKey(name)]
    }

    func getMethod(name: String) -> OneMethod? {
        return methods[OneReflect.nameKey(name)]
    }

    func addField(_ field: OneField) -> OneClass {
        fields[OneReflect.nameKey(field.name)] = field;
        return self;
    }

    func addMethod(_ method: OneMethod) -> OneClass {
        methods[OneReflect.nameKey(method.name)] = method;
        return self;
    }
}

class OneField {
    var name: String
    var isStatic: Bool
    var type: String
    var getter: (_ obj: Any?) -> Any?
    var setter: (_ obj: Any?, _ value: Any?) -> Void

    init(_ name: String, _ isStatic: Bool, _ type: String, _ getter: @escaping (_ obj: Any?) -> Any?, _ setter: @escaping (_ obj: Any?, _ value: Any?) -> Void) {
        self.name = name
        self.isStatic = isStatic
        self.type = type
        self.getter = getter
        self.setter = setter
    }    

    func getValue(obj: Any?) -> Any? {
        return getter(obj)
    }

    func setValue(obj: Any?, value: Any?) {
        setter(obj, value)
    }

}
class OneMethodArgument {
    var name: String
    var type: String

    init(_ name: String, _ type: String) {
        self.name = name
        self.type = type
    }    
}

class OneMethod {
    var name: String
    var isStatic: Bool
    var returnType: String
    var args: [OneMethodArgument]
    var invoker: (_ obj: Any?, _ args: [Any]) -> Any?

    init(_ name: String, _ isStatic: Bool, _ returnType: String, _ args: [OneMethodArgument], _ invoker: @escaping (_ obj: Any?, _ args: [Any]) -> Any?) {
        self.name = name
        self.isStatic = isStatic
        self.returnType = returnType
        self.args = args
        self.invoker = invoker
    }

    func call(obj: Any?, args: [Any]) -> Any? {
        return invoker(obj, args)
    }
}
