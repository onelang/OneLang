class Calculator {
    calc() {
        return 4;
    }
}

console.log("Hello!");

const calc = new Calculator();
console.log(`n = ${calc.calc()}`);

const arr = [1, 2, 3];
const map = {
    a: 2,
    b: 3
};
console.log(`map['a'] = ${map["a"]}, arr[1] = ${arr[1]}`);

if (arr[0] == 1) {
    console.log("TRUE-X");
} else {
    console.log("FALSE");
}

let sum = 0;
for (let i = 0; i < 10; i++) {
    sum += i + 2;
}
console.log(sum);