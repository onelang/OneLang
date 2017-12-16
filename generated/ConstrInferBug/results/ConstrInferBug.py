class TestClass:
    def method_test(self, method_param):
        pass
    
    def test_method(self):
        pass

try:
    TestClass().test_method()
except Exception as err:
    print "Exception: " + err.message