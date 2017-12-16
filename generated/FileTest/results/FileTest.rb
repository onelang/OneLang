class TestClass 
  def initialize()
  end

  def test_method()
      file_content = IO.read("../../input/test.txt")
      return file_content
  end
end

begin
    TestClass.new().test_method()
rescue Exception => err
    print "Exception: #{err}"
end