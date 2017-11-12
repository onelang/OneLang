class TokenType 
  @@end_token = "EndToken"
        
  @@whitespace = "Whitespace"
        
  @@identifier = "Identifier"
        
  @@operator_x = "Operator"
        
  @@no_initializer = nil
        

  def initialize()
      
      
      
      
      
  end

  
end

class Token 
  attr_accessor(:value)
  attr_accessor(:is_operator)

  def initialize(value, is_operator)
      
      

      self.is_operator = is_operator
      self.value = value
  end

  
end

class StringHelper 
  

  def initialize()
      
  end

  def starts_with_at_index(str, substr, idx)
      return str[idx...idx + substr.length] == substr
  end
end

class Tokenizer 
  attr_accessor(:offset)
  attr_accessor(:text)
  attr_accessor(:operators)

  def initialize(text, operators)
      @offset = 0
      
      

      self.operators = operators
      self.text = text
  end

  def get_token_type()
      if self.offset >= self.text.length
          return TokenType.end_token
      end
      
      c = self.text[self.offset]
      return c == " " || c == "\n" || c == "\t" || c == "\r" ? TokenType.whitespace : ("A" <= c && c <= "Z") || ("a" <= c && c <= "z") || ("0" <= c && c <= "9") || c == "_" ? TokenType.identifier : TokenType.operator_x
  end
  
  def tokenize()
      result = []
      
      while self.offset < self.text.length
          char_type = self.get_token_type()
          if char_type == TokenType.whitespace
              while self.get_token_type() == TokenType.whitespace
                  self.offset += 1
              end
          elsif char_type == TokenType.identifier
              start_offset = self.offset
              while self.get_token_type() == TokenType.identifier
                  self.offset += 1
              end
              identifier = self.text[start_offset...self.offset]
              result << Token.new(identifier, false)
            else
          op = ""
          for curr_op in self.operators
              if StringHelper.starts_with_at_index(self.text, curr_op, self.offset)
                  op = curr_op
                  break
              end
          end
          if op == ""
              return nil
          end
          self.offset += op.length
          result << Token.new(op, true)
            end
          
          
          
      end
      
      return result
  end
end

class TestClass 
  

  def initialize()
      
  end

  def test_method()
      operators = ["<<", ">>", "++", "--", "==", "!=", "!", "<", ">", "=", "(", ")", "[", "]", "{", "}", ";", "+", "-", "*", "/", "&&", "&", "%", "||", "|", "^", ",", "."]
      
      input = "hello * 5"
      tokenizer = Tokenizer.new(input, operators)
      result = tokenizer.tokenize()
      
      puts "token count:"
      puts result.length
      for item in result
          puts item.value + "(" + (item.is_operator ? "op" : "id") + ")"
      end
  end
end

TestClass.new().test_method()