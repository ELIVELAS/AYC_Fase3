# Especificación técnica de lenguajes de salida

## Decisión
El compilador se implementará en JavaScript con Node.js. Los lenguajes de salida seleccionados desde la Fase 1 son JavaScript y Python.

## Justificación
JavaScript permite mantener la implementación principal en un entorno que el equipo ya maneja y ejecutarla con Node.js. Python se selecciona como segundo lenguaje de salida por su sintaxis compacta y porque permite documentar claramente las equivalencias del pseudocódigo. La selección cumple el mínimo de dos lenguajes de salida solicitado por la guía.

## Equivalencias principales

| Pseudocódigo | JavaScript | Python |
|---|---|---|
| Escribir | console.log(...) | print(...) |
| Leer | readline de Node.js | input() |
| = | = | = |
| Y | && | and |
| O | || | or |
| NO | ! | not |
| Si / Sino | if / else | if / else |
| Mientras | while | while |
| Para | for | for / range |
| Comentario | // | # |
| Arreglo 1D | Array | list |
| Función | function | def |

## Tipos
El pseudocódigo mínimo contempla entero, decimal y cadena. JavaScript utiliza el tipo Number para valores numéricos y String para cadenas; Python diferencia int, float y str de manera natural.

## Entrada/salida
En JavaScript de consola se utilizará el módulo integrado `node:readline/promises`. En Python se utilizarán `input()` y `print()`.

## Nota de continuidad
En las fases posteriores, las equivalencias de esta sección servirán para los módulos de generación de código. La generación definitiva deberá realizarse a partir del AST, no mediante sustitución línea por línea.
