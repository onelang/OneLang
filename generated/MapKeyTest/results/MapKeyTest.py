class TestClass:
    def test_method(self):
        map = {
        }
        keys = map.keys()

try:
    TestClass().test_method()
except Exception as err:
    print "Exception: " + err.message