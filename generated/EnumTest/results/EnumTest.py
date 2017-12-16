from enum import Enum
class TestEnum(Enum):
    ITEM1 = 0
    ITEM2 = 1

class TestClass:
    def test_method(self):
        enum_v = TestEnum.ITEM1
        if 3 * 2 == 6:
            enum_v = TestEnum.ITEM2
        
        check1 = "SUCCESS" if enum_v == TestEnum.ITEM2 else "FAIL"
        check2 = "FAIL" if enum_v == TestEnum.ITEM1 else "SUCCESS"
        
        print "Item1: %s, Item2: %s, checks: %s %s" % (TestEnum.ITEM1, enum_v, check1, check2, )

try:
    TestClass().test_method()
except Exception as err:
    print "Exception: " + err.message