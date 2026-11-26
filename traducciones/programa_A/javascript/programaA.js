import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const rl = createInterface({ input, output });

try {
  console.log("Ingrese el primer número:");
  const a = Number(await rl.question(""));

  console.log("Ingrese el segundo número:");
  const b = Number(await rl.question(""));

  console.log("Ingrese el tercer número:");
  const c = Number(await rl.question(""));

  const resultado = ((a + b) * c) - (a / b);
  console.log("El resultado es:", resultado);
} finally {
  rl.close();
}
