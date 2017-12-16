class TestClass:
    def test_method(self):
        str = "a1A"
        i = 0
        while i < len(str):
            c = str[i]
            is_upper = "A" <= c and c <= "Z"
            is_lower = "a" <= c and c <= "z"
            is_number = "0" <= c and c <= "9"
            print "upper" if is_upper else "lower" if is_lower else "number" if is_number else "other"
            i += 1

try:
    TestClass().test_method()
except Exception as err:
    print "Exception: " + err.message