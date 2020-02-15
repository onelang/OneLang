const fileContent = OneFile.readText("../../../input/test.txt");
OneFile.writeText("test.txt", "example content");
const fileContent = OneFile.readText("test.txt");
console.log(fileContent);
