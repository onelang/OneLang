require 'one'

module TokenKind
  NUMBER = 0
  IDENTIFIER = 1
  OPERATOR_ = 2
  STRING_ = 3
end

class Token 
  attr_accessor(:kind)
  attr_accessor(:value)

  def initialize(kind, value)
      self.kind = kind
      self.value = value
  end
end

class ExprLangLexer 
  attr_accessor(:offset)
  attr_accessor(:tokens)
  attr_accessor(:expression)
  attr_accessor(:operators)

  def initialize(expression, operators)
      @offset = 0
      @tokens = []

      self.expression = expression
      self.operators = operators
      if !self.try_to_read_number()
          self.try_to_read_operator()
          self.try_to_read_literal()
      end
      
      while self.has_more_token()
          if !self.try_to_read_operator()
              self.fail("expected operator here")
          end
          if !self.try_to_read_literal()
              self.fail("expected literal here")
          end
      end
  end

  def fail(message)
      end_offset = self.offset + 30
      if end_offset > self.expression.length
          end_offset = self.expression.length
      end
      context = self.expression[self.offset...end_offset] + "..."
      raise "TokenizerException: #{message} at '#{context}' (offset: #{self.offset})"
  end

  def has_more_token()
      self.skip_whitespace()
      return !self.eof()
  end

  def add(kind, value)
      self.tokens << Token.new(kind, value)
      self.offset += value.length
  end

  def try_to_match(pattern)
      matches = One::Regex.match_from_index(pattern, self.expression, self.offset)
      return matches == nil ? "" : matches[0]
  end

  def try_to_read_operator()
      self.skip_whitespace()
      for op in self.operators
          if self.expression[self.offset...self.offset + op.length] == op
              self.add(TokenKind::OPERATOR_, op)
              return true
          end
      end
      return false
  end

  def try_to_read_number()
      self.skip_whitespace()
      
      number = self.try_to_match("[+-]?(\\d*\\.\\d+|\\d+\\.\\d+|0x[0-9a-fA-F_]+|0b[01_]+|[0-9_]+)")
      if number == ""
          return false
      end
      
      self.add(TokenKind::NUMBER, number)
      
      if self.try_to_match("[0-9a-zA-Z]") != ""
          self.fail("invalid character in number")
      end
      
      return true
  end

  def try_to_read_identifier()
      self.skip_whitespace()
      identifier = self.try_to_match("[a-zA-Z_][a-zA-Z0-9_]*")
      if identifier == ""
          return false
      end
      
      self.add(TokenKind::IDENTIFIER, identifier)
      return true
  end

  def try_to_read_string()
      self.skip_whitespace()
      
      match = self.try_to_match("'(\\\\'|[^'])*'")
      if match == ""
          match = self.try_to_match("\"(\\\\\"|[^\"])*\"")
      end
      if match == ""
          return false
      end
      
      str = match[1...1 + match.length - 2]
      str = match[0] == "'" ? str.gsub(/#{Regexp.escape("\\'")}/, "'") : str.gsub(/#{Regexp.escape("\\\"")}/, "\"")
      self.tokens << Token.new(TokenKind::STRING_, str)
      self.offset += match.length
      return true
  end

  def eof()
      return self.offset >= self.expression.length
  end

  def skip_whitespace()
      while !self.eof()
          c = self.expression[self.offset]
          if c == " " || c == "\n" || c == "\t" || c == "\r"
              self.offset += 1
          else
              break
          end
      end
  end

  def try_to_read_literal()
      success = self.try_to_read_identifier() || self.try_to_read_number() || self.try_to_read_string()
      return success
  end
end

class TestClass 
  def initialize()
  end

  def test_method()
      lexer = ExprLangLexer.new("1+2", ["+"])
      result = ""
      for token in lexer.tokens
          if result != ""
              result += ", "
          end
          result += token.value
      end
      
      puts "[#{lexer.tokens.length}]: #{result}"
  end
end

begin
    TestClass.new().test_method()
rescue Exception => err
    print "Exception: #{err}"
end