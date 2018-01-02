require 'one'

class TargetClass 
  attr_accessor(:instance_field)
  @static_field = "hello"

  class << self
    attr_accessor :static_field
  end

  def initialize()
      @instance_field = 5
  end

  def self.static_method(arg1)
      return "arg1 = #{arg1}, staticField = #{TargetClass.static_field}"
  end

  def instance_method()
      return "instanceField = #{self.instance_field}"
  end
end

One::Reflect::setup_class(One::Class.new(TargetClass, [
    One::Field.new("instance_field", false, "OneNumber"),
    One::Field.new("static_field", true, "OneString"),
  ], [
    One::Method.new("static_method", true, "OneString", [
      One::MethodArgument.new("arg1", "OneString"),
    ]),
    One::Method.new("instance_method", false, "OneString", [
    ]),
  ]));

class TestClass 
  def initialize()
  end

  def test_method()
      obj = TargetClass.new()
      #console.log(`instanceMethod (direct): ${obj.instanceMethod()}`);
      #console.log(`staticMethod (direct): ${TargetClass.staticMethod("arg1value")}`);
      #console.log(`instanceField (direct): ${obj.instanceField}`);
      #console.log(`staticField (direct): ${TargetClass.staticField}`);
      cls = One::Reflect.get_class(obj)
      if cls == nil
          puts "cls is null!"
          return
      end
      cls2 = One::Reflect.get_class_by_name("TargetClass")
      if cls2 == nil
          puts "cls2 is null!"
          return
      end
      
      method1 = cls.get_method("instanceMethod")
      if method1 == nil
          puts "method1 is null!"
          return
      end
      method1_result = method1.call(obj, [])
      puts "instanceMethod: #{method1_result}"
      
      method2 = cls.get_method("staticMethod")
      if method2 == nil
          puts "method2 is null!"
          return
      end
      method2_result = method2.call(nil, ["arg1value"])
      puts "staticMethod: #{method2_result}"
      
      field1 = cls.get_field("instanceField")
      if field1 == nil
          puts "field1 is null!"
          return
      end
      field1.set_value(obj, 6)
      field1_new_val = field1.get_value(obj)
      puts "new instance field value: #{obj.instance_field} == #{field1_new_val}"
      
      field2 = cls.get_field("staticField")
      if field2 == nil
          puts "field2 is null!"
          return
      end
      field2.set_value(nil, "bello")
      field2_new_val = field2.get_value(nil)
      puts "new static field value: #{TargetClass.static_field} == #{field2_new_val}"
  end
end

begin
    TestClass.new().test_method()
rescue Exception => err
    print "Exception: #{err}"
end