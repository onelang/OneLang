const obj1 = OneJson.parse('{ "a":1, "b":2 }');
if(!obj1.isObject()) OneError.raise("expected to be object!");
const obj1Props = obj1.asObject().getProperties();
if (obj1Props.length !== 2) OneError.raise("expected 2 properties");
if (obj1Props[0].getName() !== "a") OneError.raise("expected first property to be named 'a'");
const obj1Prop0Value = obj1Props[0].getValue(obj1);
if (!obj1Prop0Value.isNumber() || obj1Prop0Value.asNumber() !== 1) OneError.raise("expected 'a' to be 1 (number)");
console.log(`b = ${obj1.asObject().get("b").asNumber()}`);