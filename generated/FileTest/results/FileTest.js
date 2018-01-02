const fs = require('fs');

class TestClass {
  testMethod() {
    const fileContent = fs.readFileSync("../../input/test.txt", 'utf-8');
    return fileContent;
  }
}

try {
  new TestClass().testMethod();
} catch(e) {
  console.log(`Exception: ${e.message}`);
}