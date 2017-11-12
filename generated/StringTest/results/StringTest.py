class TestClass:
    def test_method(self):
        x = "x"
        y = "y"
        
        z = "z"
        z += "Z"
        z += x
        
        a = "abcdef"[2:4]
        arr = "ab  cd ef".split(" ")
        
        return z + "|" + x + y + "|" + a + "|" + arr[2]

TestClass().test_method()