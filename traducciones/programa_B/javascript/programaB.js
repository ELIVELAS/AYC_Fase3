import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const rl = createInterface({ input, output });

try {
  console.log("Ingrese su nota final:");
  const nota = Number(await rl.question(""));

  console.log("Ingrese su porcentaje de asistencia:");
  const asistencia = Number(await rl.question(""));

  if ((nota >= 6) && (asistencia >= 75)) {
    console.log("Aprobado");
  } else if ((nota >= 6) && (asistencia < 75)) {
    console.log("Reprobado por asistencia");
  } else {
    console.log("Reprobado por nota");
  }
} finally {
  rl.close();
}
