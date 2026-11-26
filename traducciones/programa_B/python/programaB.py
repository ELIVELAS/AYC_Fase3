print("Ingrese su nota final:")
nota = float(input())
print("Ingrese su porcentaje de asistencia:")
asistencia = float(input())

if (nota >= 6) and (asistencia >= 75):
    print("Aprobado")
elif (nota >= 6) and (asistencia < 75):
    print("Reprobado por asistencia")
else:
    print("Reprobado por nota")
