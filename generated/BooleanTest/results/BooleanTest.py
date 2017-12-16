class TestClass:
    def test_method(self):
        a = True
        b = False
        c = a and b
        d = a or b
        print "a: %s, b: %s, c: %s, d: %s" % ("true" if a else "false", "true" if b else "false", "true" if c else "false", "true" if d else "false", )

try:
    TestClass().test_method()
except Exception as err:
    print "Exception: " + err.message