class TokenType 
  @@end_token = "EndToken"
        
  @@whitespace = "Whitespace"
        
  @@identifier = "Identifier"
        
  @@operator_x = "Operator"
        
  @@no_initializer = nil
        

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

TestClass.new().test_method()