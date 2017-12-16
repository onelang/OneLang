class TestClass 
  def initialize()
  end

  def method_test(method_param)
  end

  def test_method()
  end
end

begin
    TestClass.new().test_method()
rescue Exception => err
    print "Exception: #{err}"
end