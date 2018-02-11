interface IPrinterBase {
    someBaseFunc(): number;
}

interface IPrinter extends IPrinterBase {
    printIt(): void;
}

class BasePrinter implements IPrinter {
    numValue = 42;
    
    // @virtual
    getValue(): string { return "Base"; }

    printIt() {
        console.log(`BasePrinter: ${this.getValue()}`);
    }

    someBaseFunc(): number { return this.numValue; }
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

        var baseP2 = new BasePrinter();
        var childP2 = new ChildPrinter();
        console.log(`${baseP2.numValue} == ${childP2.numValue}`);
    }
}