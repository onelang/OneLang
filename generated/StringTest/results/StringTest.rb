class TestClass 
  def initialize()
  end

  def test_method()
      x = "x"
      y = "y"
      
      z = "z"
      z += "Z"
      z += x
      
      a = "abcdef"[2...4]
      arr = "ab  cd ef".split(" ")
      
      return z + "|" + x + y + "|" + a + "|" + arr[2]
  end
end

begin
    TestClass.new().test_method()
rescue Exception => err
    print "Exception: #{err}"
end