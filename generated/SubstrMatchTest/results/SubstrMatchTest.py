class TestClass:
    def test_method(self):
        str = "ABCDEF"
        t_a0_true = str.startswith("A", 0)
        t_a1_false = str.startswith("A", 1)
        t_b1_true = str.startswith("B", 1)
        t_c_d2_true = str.startswith("CD", 2)
        print "%s %s %s %s" % ("true" if t_a0_true else "false", "true" if t_a1_false else "false", "true" if t_b1_true else "false", "true" if t_c_d2_true else "false", )

try:
    TestClass().test_method()
except Exception as err:
    print "Exception: " + err.message