import OneLang.Test.SelfTestRunner.SelfTestRunner;
import OneLang.Generator.CsharpGenerator.CsharpGenerator;

public class Main {
  public static void main(String[] args) {
    System.exit(new SelfTestRunner("../../").runTest(new CsharpGenerator()) ? 0 : 1);
  }
}