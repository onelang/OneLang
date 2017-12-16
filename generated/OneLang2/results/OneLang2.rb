class TokenKind 
  @number = "number"
  @identifier = "identifier"
  @operator_x = "operator"
  @string_x = "string"

  class << self
    attr_accessor :number, :identifier, :operator_x, :string_x
  end

  def initialize()
  end
end

class Token 
  attr_accessor(:kind)
  attr_accessor(:value)

  def initialize(kind, value)
      self.value = value
      self.kind = kind
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

      self.operators = operators
      self.expression = expression
      if !self.try_to_read_number()
          self.try_to_read_operator()
          self.try_to_read_literal()
      end
      
      while self.has_more_token()
          if !self.try_to_read_operator()
              self.fail("expected operator here")
          end
          self.try_to_read_literal()
      end
  end

  def fail(message)
      context = self.expression[self.offset...self.offset + 30] + "..."
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
      matches = .(pattern, self.expression, self.offset)
      return matches[0]
  end

  def try_to_read_operator()
      self.skip_whitespace()
      for op in self.operators
          if self.expression[self.offset...self.offset + op.length] == op
              self.add(TokenKind.operator_x, op)
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
      
      self.add(TokenKind.number, number)
      if self.try_to_match("[0-9a-zA-Z]")
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
      
      self.add(TokenKind.identifier, identifier)
      return true
  end

  def try_to_read_string()
      self.skip_whitespace()
      
      match = self.try_to_match("\'(\\\\\'|[^\'])*\'")
      if match == nil
          match = self.try_to_match("\"(\\\\\"|[^\"])*\"")
      end
      if match == nil
          return false
      end
      
      str = match[1...1 + match.length - 2]
      str = match[0] == "\'" ? str.gsub(/#{Regexp.escape("\\\'")}/, "\'") : str.gsub(/#{Regexp.escape("\\\"")}/, "\"")
      self.tokens << Token.new(TokenKind.string_x, str)
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
      puts "Token count: #{lexer.tokens.length}"
  end
end

begin
    TestClass.new().test_method()
rescue Exception => err
    print "Exception: #{err}"
end