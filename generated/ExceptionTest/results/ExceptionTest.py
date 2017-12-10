class TestClass:
    def test_method(self):
        raise Exception("exception message")

try:
    TestClass().test_method()
except Exception as err:
    print "Exception: " + err.message