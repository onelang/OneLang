class TestClass 
  def initialize()
  end

  def not_throws()
      return 5
  end

  def f_throws()
      raise "exception message"
  end

  def test_method()
      puts self.not_throws()
      self.f_throws()
  end
end

begin
    TestClass.new().test_method()
rescue Exception => err
    print "Exception: #{err}"
end