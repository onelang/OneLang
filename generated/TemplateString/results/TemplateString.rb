class TestClass 
  def initialize()
  end

  def test_method()
      str_val = "str"
      num = 1337
      b = true
      result = "before #{str_val}, num: #{num}, true: #{b} after"
      puts result
      puts "before #{str_val}, num: #{num}, true: #{b} after"
      
      result2 = "before " + str_val + ", num: " + (num).to_s + ", true: " + (b).to_s + " after"
      puts result2
  end
end

begin
    TestClass.new().test_method()
rescue Exception => err
    print "Exception: #{err}"
end