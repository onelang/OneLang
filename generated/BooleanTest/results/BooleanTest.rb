class TestClass 
  def initialize()
  end

  def test_method()
      a = true
      b = false
      c = a && b
      d = a || b
      puts "a: #{a}, b: #{b}, c: #{c}, d: #{d}"
  end
end

TestClass.new().test_method()