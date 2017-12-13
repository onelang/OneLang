class TestClass:
    def not_throws(self):
        return 5
    
    def f_throws(self):
        raise Exception("exception message")
    
    def test_method(self):
        print self.not_throws()
        self.f_throws()

try:
    TestClass().test_method()
except Exception as err:
    print "Exception: " + err.message