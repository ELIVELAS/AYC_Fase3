const fs = require('node:fs');
function leer() {
    const bytes = Buffer.alloc(1); let line = '';
    while (fs.readSync(0, bytes, 0, 1, null)) {
        if (bytes[0] === 10) break;
        line += String.fromCharCode(bytes[0]);
    }
    if (!line.trim() || !Number.isFinite(Number(line))) throw new Error('Entrada numérica inválida');
    return Number(line);
}
function texto(v) { return String(v); }
function arreglo(n) {
    if (!Number.isInteger(n) || n < 1 || n > 100000) throw new Error('Tamaño de arreglo inválido');
    return Array(n).fill(0);
}
function indice(a, i) {
    if (!Number.isInteger(i) || i < 1 || i > a.length) throw new Error('Índice fuera de rango');
    return i - 1;
}
function dividir(a, b) { if (b === 0) throw new Error('División por cero'); return a / b; }
function* recorrido(a, b, paso) {
    if (![a,b,paso].every(Number.isFinite) || paso === 0) throw new Error('Paso o límite inválido');
    for (let i = a; paso > 0 ? i <= b : i >= b; i += paso) yield i;
}

let v_n = undefined;
let v_factorial = undefined;
let v_suma = undefined;
let v_i = undefined;
console.log(texto("Ingrese un número entero positivo:"));
v_n = leer();
v_factorial = 1;
v_suma = 0;
for (const ciclo_1 of recorrido(1, v_n, 1)) {
    v_i = ciclo_1;
    v_factorial = (v_factorial * v_i);
    v_suma = (v_suma + (v_i * 2));
}
console.log(texto("El factorial es: ") + texto(v_factorial));
console.log(texto("La suma es: ") + texto(v_suma));
