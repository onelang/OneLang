class TestClass 
  def initialize()
  end

  def test_method()
      str = "a1A"
      i = 0
      while i < str.length
          c = str[i]
          is_upper = "A" <= c && c <= "Z"
          is_lower = "a" <= c && c <= "z"
          is_number = "0" <= c && c <= "9"
          puts is_upper ? "upper" : is_lower ? "lower" : is_number ? "number" : "other"
          i += 1
      end
  end
end

begin
    TestClass.new().test_method()
rescue Exception => err
    print "Exception: #{err}"
end