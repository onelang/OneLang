class TestClass 
  def initialize()
  end

  def test_method()
      op = nil
      puts op.length
  end
end

begin
    TestClass.new().test_method()
rescue Exception => err
    print "Exception: #{err}"
end