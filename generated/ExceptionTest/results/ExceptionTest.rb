class TestClass 
  def initialize()
  end

  def test_method()
      raise "exception message"
  end
end

begin
    TestClass.new().test_method()
rescue Exception => err
    print "Exception: #{err}"
end