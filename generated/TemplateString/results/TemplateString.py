class TestClass:
    def test_method(self):
        str_val = "str"
        num = 1337
        b = True
        result = "before %s, num: %s, true: %s after" % (str_val, num, "true" if b else "false", )
        print result
        print "before %s, num: %s, true: %s after" % (str_val, num, "true" if b else "false", )
        
        result2 = "before " + str_val + ", num: " + str(num) + ", true: " + ("true" if b else "false") + " after"
        print result2

try:
    TestClass().test_method()
except Exception as err:
    print "Exception: " + err.message