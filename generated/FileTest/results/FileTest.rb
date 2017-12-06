class TestClass 
  def initialize()
  end

  def test_method()
      file_content = IO.read("../../input/test.txt")
      return file_content
  end
end

TestClass.new().test_method()