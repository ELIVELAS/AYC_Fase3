# Fase 2 — Diseño e implementación del análisis del compilador

**Asignatura:** Autómatas y Compiladores, Universidad Don Bosco, ciclo 02-2026.  
**Proyecto:** Compilador de pseudocódigo fuente-a-fuente.  
**Lenguaje de implementación:** JavaScript (ES modules), Node.js >=18; interfaz HTML/CSS/JS.  
**Lenguajes destino previstos:** JavaScript y Python.  
**Base:** Proyecto Fase 1 suministrado por el equipo.  

## 1. Objetivo y alcance

La Fase 2 incorpora **análisis real**, sin modificar el estilo de la interfaz existente. Recibe pseudocódigo de texto, reconoce tokens, comprueba estructuras, construye AST, registra símbolos, valida reglas semánticas y emite diagnósticos con línea y columna. La generación automática de JavaScript/Python **no está implementada**: la rúbrica la reserva para la Fase 3. Las traducciones manuales A/B siguen disponibles solo como referencias.

## 2. Arquitectura

`Pseudocódigo (.txt) → tokenize() → tokens → parse() → AST → analyzeSemantics() → tabla de símbolos y errores`

Los resultados se muestran en la interfaz y pueden exportarse a archivos. El módulo `interfaz/core.js` se comparte entre navegador y Node.js, sin dependencias externas. `src/analizar.js` permite comprobar programas desde terminal.

## 3. Análisis léxico (20 %)

El lexer recorre cada línea de izquierda a derecha y reconoce: palabras reservadas (`Inicio`, `Fin`, `Leer`, `Escribir`, `Si`, `Entonces`, `Sino`, `FinSi`, `Para`, `Hasta`, `Hacer`, `FinPara`, `Mientras`, `Dimension`, `Funcion`, `Retornar`, `Y`, `O`, `NO`, etc.); identificadores; números enteros/decimales; cadenas entre comillas; operadores aritméticos, relacionales y de asignación; paréntesis, corchetes, comas; comentarios `//`; saltos de línea. Cada token almacena **tipo, valor, línea y columna**. Los caracteres inválidos y cadenas sin cierre se reportan como errores léxicos. Se puede visualizar la lista real de tokens con **Ver tokens**.

## 4. Análisis sintáctico y AST (20 %)

El parser usa **descenso recursivo** para instrucciones y un **parser de precedencia (Pratt)** para expresiones. Respeta la jerarquía `O` → `Y` → comparaciones → suma/resta → multiplicación/división → operadores unarios; los paréntesis alteran naturalmente la jerarquía. Los bloques se construyen recursivamente, por lo que se preservan `Si` dentro de `Si`, `Si` dentro de `Para`, y demás anidamientos. Las estructuras del AST incluyen `Program`, `Read`, `Write`, `Assignment`, `Declaration`, `ArrayDeclaration`, `If`, `While`, `For`, `Function`, `Procedure`, `Return`, `CallStatement`, `Binary`, `Unary`, `Identifier`, `Index`, `Call`, `Number`, `String`.

**Ejemplo de precedencia:** `resultado = 2 + 3 * 4` genera una asignación cuyo valor tiene raíz `Binary(+)` y un hijo derecho `Binary(*)`; en `resultado = (2 + 3) * 4` la raíz es `Binary(*)` y el hijo izquierdo `Binary(+)`. **Ver AST** presenta el árbol serializado en JSON para su explicación y defensa.

## 5. Semántica y tabla de símbolos (20 %)

La tabla registra nombre, tipo inferido o declarado, clase (`variable`, `arreglo`, `función`, `procedimiento`, `parámetro`), línea de declaración y ámbito. El análisis valida uso de identificadores existentes, duplicaciones en el mismo ámbito, compatibilidad numérica/cadena, operandos lógicos, índices numéricos, uso de arreglos, número de argumentos en llamadas y `Retornar` dentro de funciones.

**Decisión importante:** los programas obligatorios A-D del anexo utilizan `Leer a`, `suma = 0`, etc. sin `Entero a` previo. Para respetar los programas oficiales, se admite **declaración implícita en la primera lectura o asignación**; una referencia usada antes de su primera definición sí genera error. Las declaraciones explícitas `Entero`, `Decimal` y `Cadena` se admiten y verifican. Las funciones tienen ámbito local para parámetros y variables internas. La forma `Funcion area = CalcularArea(base, altura)` del Programa E se reconoce como extensión necesaria respecto a la EBNF inicial.

## 6. Gestor de errores (25 %)

Los errores se agrupan por categoría **Léxico, Sintáctico y Semántico** y contienen mensaje, línea y columna. El parser intenta recuperarse al final de la línea para informar varios errores. En el navegador aparecen en consola y **Ver errores**; **Exportar errores .txt** produce un archivo con el número total y la ubicación de cada error. Desde terminal, `npm run analizar -- pseudocodigo/programa_D.txt` escribe en `reportes/` los archivos `*_errores.txt`, `*_AST.json`, `*_tokens.json` y `*_simbolos.json`. Si no hay errores, el archivo indica **Cantidad de errores: 0** y **Análisis exitoso**.

## 7. Prototipo y programas del anexo (15 %)

Se preservaron la barra lateral, paneles, paleta, botones y distribución original. Se añadieron Programas C, D y E, junto con botones para ver AST, tokens, errores, exportar errores y **Probar 3 casos**. Este último ejecuta el AST mediante un intérprete didáctico independiente (`interfaz/interpreter.js`) y compara las salidas de consola con los tres casos oficiales de cada programa. No traduce ni genera código JavaScript/Python. **Analizar** ejecuta el motor real; **Compilar** analiza primero, y solo muestra la traducción manual de A/B si la entrada coincide exactamente con uno de esos ejemplos. Para C/D/E o pseudocódigo personalizado informa que la generación automática corresponde a Fase 3. La salida del panel derecho no debe confundirse con la salida de ejecución de los programas: en esta fase se comprueba la estructura y validez del código fuente.

**Programa C:** contiene `Para` con acumuladores `factorial` y `suma`; el AST incluye el ciclo y las dos asignaciones dentro de él. **Programa D:** contiene `Dimension numeros[n]`, `Para`, `Leer numeros[i]` y `Si` anidado; el AST refleja arreglo, indexación, ciclo y condicional. Se conservan también A, B y E para pruebas adicionales.

## 8. Pruebas automatizadas

Ejecutar `npm test`. El conjunto incluye reconocimiento de los cinco programas oficiales, precedencia con y sin paréntesis, anidamiento de B/D, errores léxicos, sintácticos y semánticos, duplicación, tipos, reporte cero errores y aridad de funciones. Las pruebas verifican tanto el **análisis** como la **ejecución didáctica del AST** para los 15 casos del anexo A–E. Esto no sustituye la validación futura del código **generado automáticamente en JavaScript y Python**, requerida en la Fase 3.

## 9. Limitaciones y trabajo posterior

- No se genera JavaScript/Python automáticamente desde AST en Fase 2.
- El análisis semántico es estático y no simula la ejecución ni calcula salidas de consola.
- Se admite la dimensión variable `numeros[n]` porque aparece en el anexo D, aunque la especificación general habla de arreglos de tamaño fijo declarado; su tamaño queda establecido al ejecutar el programa futuro.
- Se conserva el criterio de declaraciones implícitas por compatibilidad con el anexo; puede endurecerse si el docente lo solicita.
- La recuperación de errores es básica (sincronización por líneas); no garantiza identificar todas las causas independientes de un archivo muy mal formado.
- La validación completa de límites de arreglos, flujo de datos y tipos de retorno queda como mejora futura.

## 10. Guion breve de demostración

1. Iniciar `npm run ui`, abrir `http://localhost:3000`.
2. Seleccionar **Programa C** → **Analizar** → mostrar tokens, AST (nodo `For`), tabla de símbolos y **0 errores**.
3. Seleccionar **Programa D** → **Analizar** → mostrar `ArrayDeclaration`, `For`, `If`, símbolos `numeros`, `i`, `suma`, etc.
4. Pulsar **Probar 3 casos** en C y D y mostrar las salidas esperadas y obtenidas.
5. Introducir un error, por ejemplo reemplazar `suma = suma + numeros[i]` por `suma = suma + desconocida` → **Analizar** → mostrar error semántico y su línea.
6. Pulsar **Exportar errores .txt** y abrir el archivo.
7. Aclarar que la **generación automática y validación de salidas de consola** pertenecen a la Fase 3.

## 11. Correspondencia con rúbrica

| Criterio | Evidencia |
|---|---|
| Léxico (20 %) | `tokenize()`, tokens con posición, `Ver tokens`, pruebas |
| Sintáctico/AST (20 %) | `parse()`, AST JSON, precedencia, anidamiento, pruebas |
| Semántico/símbolos (20 %) | `analyzeSemantics()`, tabla real, tipos, ámbitos, pruebas |
| Errores (25 %) | `CompileError`, consola, exportación `.txt`, líneas y columnas |
| Prototipo C/D (15 %) | Ejemplos C/D en selector, análisis real, AST, pruebas |

## 12. Referencias

Universidad Don Bosco. (2026). *Ruta de aprendizaje: Autómatas y Compiladores, ciclo 02-2026*. Material de asignatura.

Mozilla Developer Network. (s. f.). *JavaScript guide*. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide

Node.js. (s. f.). *Node.js documentation*. https://nodejs.org/docs/latest/api/
