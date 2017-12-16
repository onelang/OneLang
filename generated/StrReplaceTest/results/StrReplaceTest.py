class TestClass:
    def test_method(self):
        str = "A x B x C x D"
        result = str.replace("x", "y")
        print "R: %s, O: %s" % (result, str, )

try:
    TestClass().test_method()
except Exception as err:
    print "Exception: " + err.message