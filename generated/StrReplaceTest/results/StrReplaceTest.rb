class TestClass 
  def initialize()
  end

  def test_method()
      str = "A x B x C x D"
      result = str.gsub(/#{Regexp.escape("x")}/, "y")
      puts "R: #{result}, O: #{str}"
  end
end

begin
    TestClass.new().test_method()
rescue Exception => err
    print "Exception: #{err}"
end