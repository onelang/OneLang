class TestClass:
    def test_method(self):
        constant_arr = [5]
        
        mutable_arr = [1]
        mutable_arr.append(2)
        
        print "len1: %s, len2: %s" % (len(constant_arr), len(mutable_arr), )

try:
    TestClass().test_method()
except Exception as err:
    print "Exception: " + err.message