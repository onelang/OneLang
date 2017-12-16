class TestClass 
  def initialize()
  end

  def test_method()
      result = []
      map = {
        "x" => 5,
      }
      keys = map.keys
      puts result
      puts keys
  end
end

begin
    TestClass.new().test_method()
rescue Exception => err
    print "Exception: #{err}"
end