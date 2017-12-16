class MapX 
  def initialize()
  end

  def set(key, value)
  end

  def get(key)
      return nil
  end
end

class Main 
  def initialize()
  end

  def test()
      map = MapX.new()
      map.set("hello", 3)
      num_value = map.get("hello2")
  end
end