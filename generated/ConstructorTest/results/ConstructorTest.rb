class ConstructorTest 
  attr_accessor(:field2)
  attr_accessor(:field1)

  def initialize(field1)
      self.field1 = field1
      self.field2 = field1 * self.field1 * 5
  end
end

class TestClass 
  def initialize()
  end

  def test_method()
      test = ConstructorTest.new(3)
      puts test.field2
  end
end

begin
    TestClass.new().test_method()
rescue Exception => err
    print "Exception: #{err}"
end