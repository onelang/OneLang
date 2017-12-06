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

TestClass.new().test_method()