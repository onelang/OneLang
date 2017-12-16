class TestClass:
    def map_test(self):
        map_obj = {
          "x": 5,
          "y": 3,
        }
        
        #let containsX = "x" in mapObj;
        map_obj["z"] = 9
        del map_obj["x"]
        
        keys_var = map_obj.keys()
        values_var = map_obj.values()
        return map_obj["z"]
    
    def explicit_type_test(self):
        op = ""
        print len(op)
    
    def if_test(self, x):
        result = "<unk>"
        
        if x > 3:
            result = "hello"
        elif x < 1:
            result = "bello"
        elif x < 0:
            result = "bello2"
        else:
            result = "???"
        
        if x > 3:
            result = "z"
        
        if x > 3:
            result = "x"
        else:
            result = "y"
        
        return result
    
    def array_test(self):
        #const c2 = new Class2();
        
        mutable_arr = [1, 2]
        mutable_arr.append(3)
        mutable_arr.append(4)
        # mutableArr.push(c2.property);
        # mutableArr.push(c2.child.property);
        # mutableArr.push(c2.child.child.property);
        
        constant_arr = [5, 6]
        
        # some comment
        #   some comment line 2
        for item in mutable_arr:
            print item
        
        # some other comment
        # multiline and stuff
        i = 0
        while i < len(constant_arr):
            print constant_arr[i]
            i += 1
    
    def calc(self):
        return (1 + 2) * 3
    
    def method_with_args(self, arg1, arg2, arg3):
        stuff = arg1 + arg2 + arg3 * self.calc()
        return stuff
    
    def string_test(self):
        x = "x"
        y = "y"
        
        z = "z"
        z += "Z"
        z += x
        
        return z + "|" + x + y
    
    def reverse_string(self, str):
        result = ""
        i = len(str) - 1
        while i >= 0:
            result += str[i]
            i -= 1
        return result
    
    def get_bool_result(self, value):
        return value
    
    def test_method(self):
        self.array_test()
        print self.map_test()
        print self.string_test()
        print self.reverse_string("print value")
        print "true" if self.get_bool_result(True) else "false"

try:
    TestClass().test_method()
except Exception as err:
    print "Exception: " + err.message