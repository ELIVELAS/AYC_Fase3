# Compilador de pseudocódigo - Fase 3

Proyecto de Autómatas y Compiladores. Analiza archivos de pseudocódigo y genera JavaScript y Python a partir del AST.

## Requisitos

- Node.js 18 o superior.
- Python 3 disponible como `python` en Windows o `python3` en Linux. Si se usa otro ejecutable, configurar la variable de entorno PYTHON.

No requiere instalar paquetes externos.

## Uso

Desde la carpeta que contiene package.json:

```sh
npm run ui
```

Abrir http://localhost:3000. Cargar un archivo .txt o seleccionar un ejemplo. Analizar, compilar, elegir el lenguaje y exportar. Probar 3 casos ejecuta el código generado en el lenguaje seleccionado mediante el servidor local. Los casos corresponden al ejemplo seleccionado, incluso si se modifica el editor.

## Comprobación desde terminal

```sh
npm test
npm run analizar -- pseudocodigo/programa_C.txt
npm run compilar -- pseudocodigo/programa_C.txt
node salidas/programa_C.cjs
python salidas/programa_C.py
```

En Linux usar python3. Ingresar 4 cuando se solicite: factorial 24, suma 20. La compilación crea archivos .txt y ejecutables .cjs/.py, además del reporte de errores. El análisis exporta tokens, AST y símbolos a reportes/.

## Archivos principales

- interfaz/core.js: analizadores y reporte de errores.
- interfaz/generator.js: recorrido del AST y generación de código.
- interfaz/app.js: conexión con la interfaz original.
- src/compilar.js: compilación desde terminal.
- src/ejecutar.js: ejecución real en archivos temporales.
- tests/: pruebas de análisis, intérprete y código generado.
- pseudocodigo/: cinco programas del anexo.
- documentacion/Fase3.md: resumen técnico y guía de comprobación.

El servidor está pensado para uso local, no para publicarlo como servicio de ejecución de código. Las ejecuciones de prueba tienen un límite de tres segundos. Los archivos de traducciones/ son referencias históricas de la fase 1, no se usan para generar código.
