module TestEnum
  ITEM1 = 0
  ITEM2 = 1
end

class TestClass 
  def initialize()
  end

  def test_method()
      enum_v = TestEnum::ITEM1
      if 3 * 2 == 6
          enum_v = TestEnum::ITEM2
      end
      
      check1 = enum_v == TestEnum::ITEM2 ? "SUCCESS" : "FAIL"
      check2 = enum_v == TestEnum::ITEM1 ? "FAIL" : "SUCCESS"
      
      puts "Item1: #{TestEnum::ITEM1}, Item2: #{enum_v}, checks: #{check1} #{check2}"
  end
end

begin
    TestClass.new().test_method()
rescue Exception => err
    print "Exception: #{err}"
end