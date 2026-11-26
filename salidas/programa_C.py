import math

def leer():
    n = float(input())
    if not math.isfinite(n):
        raise ValueError('Entrada numérica inválida')
    return int(n) if n.is_integer() else n

def texto(v):
    if isinstance(v, bool):
        return str(v).lower()
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    return str(v)

def arreglo(n):
    if not isinstance(n, (int, float)) or int(n) != n or not 1 <= n <= 100000:
        raise ValueError('Tamaño de arreglo inválido')
    return [0] * int(n)

def indice(a, i):
    if int(i) != i or not 1 <= i <= len(a):
        raise ValueError('Índice fuera de rango')
    return int(i) - 1

def dividir(a, b):
    if b == 0:
        raise ValueError('División por cero')
    return a / b

def recorrido(a, b, paso):
    if not all(math.isfinite(x) for x in (a,b,paso)) or paso == 0:
        raise ValueError('Paso o límite inválido')
    i = a
    while (i <= b if paso > 0 else i >= b):
        yield i
        i += paso

v_n = None
v_factorial = None
v_suma = None
v_i = None
print(texto("Ingrese un número entero positivo:"), sep="")
v_n = leer()
v_factorial = 1
v_suma = 0
for ciclo_1 in recorrido(1, v_n, 1):
    v_i = ciclo_1
    v_factorial = (v_factorial * v_i)
    v_suma = (v_suma + (v_i * 2))
print(texto("El factorial es: "), texto(v_factorial), sep="")
print(texto("La suma es: "), texto(v_suma), sep="")
