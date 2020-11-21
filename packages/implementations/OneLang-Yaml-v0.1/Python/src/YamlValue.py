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