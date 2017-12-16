class TestClass:
    def test_method(self):
        print "Hello world!"

try:
    TestClass().test_method()
except Exception as err:
    print "Exception: " + err.message