class TestClass 
  def initialize()
  end

  def map_test()
      map_obj = {
        "x" => 5,
        "y" => 3,
      }
      
      #let containsX = "x" in mapObj;
      map_obj["z"] = 9
      map_obj.delete("x")
      
      keys_var = map_obj.keys
      values_var = map_obj.values
      return map_obj["z"]
  end

  def explicit_type_test()
      op = ""
      puts op.length
  end

  def if_test(x)
      result = "<unk>"
      
      if x > 3
          result = "hello"
      elsif x < 1
          result = "bello"
      elsif x < 0
          result = "bello2"
      else
          result = "???"
      end
      
      if x > 3
          result = "z"
      end
      
      if x > 3
          result = "x"
      else
          result = "y"
      end
      
      return result
  end

  def array_test()
      #const c2 = new Class2();
      
      mutable_arr = [1, 2]
      mutable_arr << 3
      mutable_arr << 4
      # mutableArr.push(c2.property);
      # mutableArr.push(c2.child.property);
      # mutableArr.push(c2.child.child.property);
      
      constant_arr = [5, 6]
      
      # some comment
      #   some comment line 2
      for item in mutable_arr
          puts item
      end
      
      # some other comment
      # multiline and stuff
      i = 0
      while i < constant_arr.length
          puts constant_arr[i]
          i += 1
      end
  end

  def calc()
      return (1 + 2) * 3
  end

  def method_with_args(arg1, arg2, arg3)
      stuff = arg1 + arg2 + arg3 * self.calc()
      return stuff
  end

  def string_test()
      x = "x"
      y = "y"
      
      z = "z"
      z += "Z"
      z += x
      
      return z + "|" + x + y
  end

  def reverse_string(str)
      result = ""
      i = str.length - 1
      while i >= 0
          result += str[i]
          i -= 1
      end
      return result
  end

  def get_bool_result(value)
      return value
  end

  def test_method()
      self.array_test()
      puts self.map_test()
      puts self.string_test()
      puts self.reverse_string("print value")
      puts self.get_bool_result(true) ? "true" : "false"
  end
end

begin
    TestClass.new().test_method()
rescue Exception => err
    print "Exception: #{err}"
end