class Calculator {
    calc(n: number) {
        if (n <= 1) {
            return 1;
        } else {
            return this.calc(n - 1) * n;
        }
    }
}

const calc = new Calculator();
console.log(`result = ${calc.calc(10)}`);

console.log("Hello!");

const arr = [1, 2, 3];
arr.push(4);

console.log(`n = ${arr.length}, arr[0] = ${arr[0]}`);

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

console.log(`5! = ${calc.factor(5)}`);