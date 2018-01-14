interface IPrinterBase {
    someBaseFunc(): number;
}

interface IPrinter extends IPrinterBase {
    printIt();
}

class BasePrinter implements IPrinter {
    // @virtual
    getValue(): string { return "Base"; }

    printIt() {
        console.log(`BasePrinter: ${this.getValue()}`);
    }

    someBaseFunc(): number { return 42; }
}

class ChildPrinter extends BasePrinter {
    // @override
    getValue(): string { return "Child"; }
}

class TestClass {
    getPrinter(name: string): IPrinter {
        const result: IPrinter = name === "child" ? new ChildPrinter() : new BasePrinter();
        return result;
    }

    testMethod() {
        const basePrinter = this.getPrinter("base");
        const childPrinter = this.getPrinter("child");
        basePrinter.printIt();
        childPrinter.printIt();
        console.log(`${basePrinter.someBaseFunc()} == ${childPrinter.someBaseFunc()}`);
    }
}