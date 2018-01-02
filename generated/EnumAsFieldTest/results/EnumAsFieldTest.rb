module SomeKind
  ENUM_VAL0 = 0
  ENUM_VAL1 = 1
  ENUM_VAL2 = 2
end

class TestClass 
  attr_accessor(:enum_field)

  def initialize()
      @enum_field = SomeKind::ENUM_VAL2
  end

  def test_method()
      puts "Value: #{self.enum_field}"
  end
end

begin
    TestClass.new().test_method()
rescue Exception => err
    print "Exception: #{err}"
end