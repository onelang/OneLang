class TokenType 
  @end_token = "EndToken"
  @whitespace = "Whitespace"
  @identifier = "Identifier"
  @operator_x = "Operator"
  @no_initializer = nil

  class << self
    attr_accessor :end_token, :whitespace, :identifier, :operator_x, :no_initializer
  end

  def initialize()
  end
end

class TestClass 
  def initialize()
  end

  def test_method()
      casing_test = TokenType.end_token
      return casing_test
  end
end

begin
    TestClass.new().test_method()
rescue Exception => err
    print "Exception: #{err}"
end