class TestClass:
    def test_method(self):
        result = []
        map = {
          "x": 5,
        }
        keys = map.keys()
        print result
        print keys

try:
    TestClass().test_method()
except Exception as err:
    print "Exception: " + err.message