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

TestClass.new().test_method()