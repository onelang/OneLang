classes = {}

def get_class(obj):
    return classes.get(name_key(obj.__class__.__name__))

def get_class_by_name(name):
    return classes.get(name_key(name))

def setup_class(cls):
    classes[name_key(cls.name)] = cls

def name_key(name):
    return name.lower().replace("_", "")

class Class:
    def __init__(self, typeObj, fields, methods):
        self.typeObj = typeObj
        self.name = typeObj.__name__
        
        self.fields = {}
        for field in fields:
            field.cls = self
            self.fields[name_key(field.name)] = field
        
        self.methods = {}
        for method in methods:
            method.cls = self
            self.methods[name_key(method.name)] = method
    
    def get_field(self, name):
        return self.fields.get(name_key(name))
        
    def get_method(self, name):
        return self.methods.get(name_key(name))

    def get_fields(self):
        return self.fields.values()

    def get_methods(self):
        return self.methods.values()

class Field:
    def __init__(self, name, is_static, type):
        self.cls = None
        self.name = name
        self.is_static = is_static
        self.type = type
    
    def get_value(self, obj):
        realObj = self.cls.typeObj if self.is_static else obj
        return getattr(realObj, self.name)
    
    def set_value(self, obj, value):
        realObj = self.cls.typeObj if self.is_static else obj
        setattr(realObj, self.name, value)

class Method:
    def __init__(self, name, is_static, return_type, args):
        self.cls = None
        self.name = name
        self.is_static = is_static
        self.return_type = return_type
        self.args = args
    
    def call(self, obj, args):
        realObj = self.cls.typeObj if self.is_static else obj
        method = getattr(realObj, self.name)
        return method(*args)

class MethodArgument:
    def __init__(self, name, type):
        self.name = name
        self.type = type