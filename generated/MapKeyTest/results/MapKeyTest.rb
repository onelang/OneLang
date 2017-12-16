class TestClass 
  def initialize()
  end

  def test_method()
      map = {
      }
      keys = map.keys
  end
end

begin
    TestClass.new().test_method()
rescue Exception => err
    print "Exception: #{err}"
end