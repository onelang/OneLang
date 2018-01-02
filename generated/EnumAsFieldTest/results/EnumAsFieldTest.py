from enum import Enum
class SomeKind(Enum):
    ENUM_VAL0 = 0
    ENUM_VAL1 = 1
    ENUM_VAL2 = 2

class TestClass:
    def __init__(self):
        self.enum_field = SomeKind.ENUM_VAL2

    def test_method(self):
        print "Value: %s" % (self.enum_field, )

try:
    TestClass().test_method()
except Exception as err:
    print "Exception: " + err.message