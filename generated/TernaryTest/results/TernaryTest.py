class TestClass:
    def get_result(self):
        return True
    
    def test_method(self):
        print "true" if self.get_result() else "false"

try:
    TestClass().test_method()
except Exception as err:
    print "Exception: " + err.message