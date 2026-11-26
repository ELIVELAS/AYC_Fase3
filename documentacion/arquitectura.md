# Arquitectura general propuesta

Pseudocódigo (.txt)
        |
        v
Análisis léxico
        |
        v
Análisis sintáctico -----> AST
        |
        v
Análisis semántico
   |              |
   v              v
Tabla de       Gestor de
símbolos       errores
        \       /
         v     v
      Fase de síntesis
      /             \
     v               v
JavaScript         Python

En la Fase 1 este diagrama es de diseño. La implementación funcional de los analizadores,
AST, tabla de símbolos y gestor de errores se reserva para las fases posteriores.
