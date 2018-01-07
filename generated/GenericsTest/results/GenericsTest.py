class MapX:
    def set(self, key, value):
        self.value = value
    
    def get(self, key):
        return self.value

class TestClass:
    def test_method(self):
        map_x = MapX()
        map_x.set("hello", 3)
        num_value = map_x.get("hello2")
        print "%s" % (num_value, )

try:
    TestClass().test_method()
except Exception as err:
    print "Exception: " + err.message