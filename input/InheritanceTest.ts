interface IPrinter {
    print();
}

class BasePrinter implements IPrinter {
    // @virtual
    getValue(): string { return "Base"; }

    print() {
        console.log(`BasePrinter: ${this.getValue()}`);
    }
}

class ChildPrinter extends BasePrinter {
    getValue(): string { return "Child"; }
}

class TestClass {
    getPrinter(name: string): IPrinter {
        const result = name === "child" ? new ChildPrinter() : new BasePrinter();
        return result;
    }

    testMethod() {
        const basePrinter = this.getPrinter("base");
        const childPrinter = this.getPrinter("child");
        basePrinter.print();
        childPrinter.print();
    }
}