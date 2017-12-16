class TestClass:
    def reverse_string(self, str):
        result = ""
        i = len(str) - 1
        while i >= 0:
            result += str[i]
            i -= 1
        return result
    
    def test_method(self):
        print self.reverse_string("print value")
        return "return value"

try:
    TestClass().test_method()
except Exception as err:
    print "Exception: " + err.message