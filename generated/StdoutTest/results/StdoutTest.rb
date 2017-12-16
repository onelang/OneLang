class TestClass 
  def initialize()
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

  def test_method()
      puts self.reverse_string("print value")
      return "return value"
  end
end

begin
    TestClass.new().test_method()
rescue Exception => err
    print "Exception: #{err}"
end