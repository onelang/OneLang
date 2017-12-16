class TestClass:
    def test_method(self):
        with open("../../input/test.txt", 'r') as f: file_content = f.read()
        return file_content

try:
    TestClass().test_method()
except Exception as err:
    print "Exception: " + err.message