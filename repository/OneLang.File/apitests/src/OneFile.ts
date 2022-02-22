import { OneFile } from "../../api/OneFile";

class OneFileTests {
    // @FileSystem
    testReadFile() {
        console.log(OneFile.readText("hello.txt"));
    }
}