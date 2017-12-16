class TestClass 
  def initialize()
  end

  def get_result()
      return true
  end

  def test_method()
      puts self.get_result() ? "true" : "false"
  end
end

begin
    TestClass.new().test_method()
rescue Exception => err
    print "Exception: #{err}"
end