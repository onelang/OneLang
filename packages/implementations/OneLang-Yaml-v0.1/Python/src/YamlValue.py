from enum import Enum

class VALUE_TYPE(Enum):
    NULL = 0
    BOOLEAN = 1
    NUMBER = 2
    STRING = 3
    ARRAY = 4
    OBJECT = 5

class YamlValue:
    def __init__(self, value):
        self.value = value

    def dbl(self, key):
        return self.value.get(key)

    def str(self, key):
        return self.value.get(key)

    def str_arr(self, key):
        return self.value.get(key) or []

    def arr(self, key):
        return map(lambda x: YamlValue(x), self.value.get(key) or [])

    def obj(self, key):
        return YamlValue(self.value.get(key))

    def dict(self, key):
        obj = self.value.get(key)
        if obj is None:
            return None

        res = {}
        for key, value in obj.items():
            res[key] = YamlValue(value)
        return res

    def as_str(self):
        return str(self.value)

    def type(self):
        if self.value is None:
            return VALUE_TYPE.NULL
        elif isinstance(self.value, bool):
            return VALUE_TYPE.BOOLEAN
        elif isinstance(self.value, int) or isinstance(self.value, float):
            return VALUE_TYPE.NUMBER
        elif isinstance(self.value, str):
            return VALUE_TYPE.STRING
        elif isinstance(self.value, list):
            return VALUE_TYPE.ARRAY
        else:
            return VALUE_TYPE.OBJECT