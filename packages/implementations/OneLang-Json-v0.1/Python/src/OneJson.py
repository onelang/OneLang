import json

class OneJValue:
    def __init__(self, value):
        self.value = value
    
    def as_object(self):
        return OneJObject(self.value)
    
    def as_string(self):
        return self.value
    
    def get_array_items(self):
        return [OneJValue(item) for item in self.value]

class OneJObject:
    def __init__(self, value):
        self.value = value
    
    def get(self, key):
        return OneJValue(self.value[key])

class OneJson:
    @staticmethod
    def parse(content):
        return OneJValue(json.loads(content))