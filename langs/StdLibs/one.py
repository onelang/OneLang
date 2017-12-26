import re

class Regex:
    @staticmethod
    def matchFromIndex(pattern, input, offset):
        patternObj = re.compile(pattern)
        match = patternObj.match(input, offset)
        if not match:
            return None
        return list(match.group(0)) + list(match.groups())

class Reflect:
    classes = {}

    @staticmethod
    def get_class(obj):
        return Reflect.classes.get(Reflect.name_key(obj.__class__.__name__))

    @staticmethod
    def get_class_by_name(name):
        return Reflect.classes.get(Reflect.name_key(name))

    @staticmethod
    def setup_class(cls):
        Reflect.classes[Reflect.name_key(cls.name)] = cls

    @staticmethod
    def name_key(name):
        return name.lower().replace("_", "")

class Class:
    def __init__(self, typeObj, fields, methods):
        self.typeObj = typeObj
        self.name = typeObj.__name__
        
        self.fields = {}
        for field in fields:
            field.cls = self
            self.fields[Reflect.name_key(field.name)] = field
        
        self.methods = {}
        for method in methods:
            method.cls = self
            self.methods[Reflect.name_key(method.name)] = method
    
    def get_field(self, name):
        return self.fields.get(Reflect.name_key(name))
        
    def get_method(self, name):
        return self.methods.get(Reflect.name_key(name))

    def get_fields(self):
        return self.fields.values()

    def get_methods(self):
        return self.methods.values()

class Field:
    def __init__(self, name, is_static):
        self.cls = None
        self.name = name
        self.is_static = is_static
    
    def get_value(self, obj):
        realObj = self.cls.typeObj if self.is_static else obj
        return getattr(realObj, self.name)
    
    def set_value(self, obj, value):
        realObj = self.cls.typeObj if self.is_static else obj
        setattr(realObj, self.name, value)

class Method:
    def __init__(self, name, is_static, args):
        self.cls = None
        self.name = name
        self.is_static = is_static
        self.args = args
    
    def call(self, obj, args):
        realObj = self.cls.typeObj if self.is_static else obj
        method = getattr(realObj, self.name)
        return method(*args)

class MethodArgument:
    def __init__(self, name, type):
        self.name = name
        self.type = type