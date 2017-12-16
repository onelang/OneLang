class TestClass 
  def initialize()
  end

  def test_method()
      str = "ABCDEF"
      t_a0_true = str[0...0 + "A".length] == "A"
      t_a1_false = str[1...1 + "A".length] == "A"
      t_b1_true = str[1...1 + "B".length] == "B"
      t_c_d2_true = str[2...2 + "CD".length] == "CD"
      puts "#{t_a0_true} #{t_a1_false} #{t_b1_true} #{t_c_d2_true}"
  end
end

begin
    TestClass.new().test_method()
rescue Exception => err
    print "Exception: #{err}"
end