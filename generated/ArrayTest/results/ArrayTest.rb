class TestClass 
  def initialize()
  end

  def test_method()
      constant_arr = [5]
      
      mutable_arr = [1]
      mutable_arr << 2
      
      puts "len1: #{constant_arr.length}, len2: #{mutable_arr.length}"
  end
end

begin
    TestClass.new().test_method()
rescue Exception => err
    print "Exception: #{err}"
end