class MapX:
    def set(self, key, value):
        pass
    
    def get(self, key):
        return None

class Main:
    def test(self):
        map = MapX()
        map.set("hello", 3)
        num_value = map.get("hello2")

TestClass().test_method()