import hashlib

def sha256d(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def hash_par(a: str, b: str) -> str:
    combined = bytes.fromhex(a) + bytes.fromhex(b)
    return sha256d(combined)

def construir_arbol(hojas: list) -> list:
    if len(hojas) % 2 == 1:
        hojas.append(hojas[-1])

    niveles = [hojas[:]]
    nivel_actual = hojas[:]

    while len(nivel_actual) > 1:
        siguiente = []
        for i in range(0, len(nivel_actual), 2):
            siguiente.append(hash_par(nivel_actual[i], nivel_actual[i + 1]))
        nivel_actual = siguiente
        niveles.append(nivel_actual[:])

    return niveles

def prueba_inclusion(niveles: list, indice: int) -> list:
    prueba = []
    for nivel in niveles[:-1]:
        hermano = indice ^ 1
        posicion = 'derecha' if hermano > indice else 'izquierda'
        if hermano < len(nivel):
            prueba.append((nivel[hermano], posicion))
        indice //= 2
    return prueba

def verificar_prueba(hoja: str, prueba: list, raiz: str) -> bool:
    hash_actual = hoja
    for hermano, posicion in prueba:
        if posicion == 'derecha':
            hash_actual = hash_par(hash_actual, hermano)
        else:
            hash_actual = hash_par(hermano, hash_actual)
    return hash_actual == raiz

# Transacciones simuladas (hashes simplificados)
transacciones = [
    sha256d(b"TX: alice->bob $200"),
    sha256d(b"TX: carol->dave $150"),
    sha256d(b"TX: eve->frank $300"),
    sha256d(b"TX: grace->henry $100"),
]

print("=== MERKLE PATRICIA TRIE ===\n")
print("Hojas (hashes de transacciones):")
for i, tx in enumerate(transacciones):
    print(f"  TX[{i}]: {tx[:20]}...")

niveles = construir_arbol(transacciones[:])

print(f"\nNiveles del arbol: {len(niveles)}")
for i, nivel in enumerate(niveles):
    etiqueta = "Raiz" if i == len(niveles) - 1 else f"Nivel {i}"
    print(f"  {etiqueta}: {[h[:12] + '...' for h in nivel]}")

raiz = niveles[-1][0]
print(f"\nRaiz Merkle: {raiz}")

indice_a_probar = 1
prueba = prueba_inclusion(niveles, indice_a_probar)

print(f"\n=== PRUEBA DE INCLUSION PARA TX[{indice_a_probar}] ===")
print(f"Hoja: {transacciones[indice_a_probar][:20]}...")
print("Nodos de la prueba:")
for nodo, pos in prueba:
    print(f"  Hermano ({pos}): {nodo[:20]}...")

resultado = verificar_prueba(transacciones[indice_a_probar], prueba, raiz)
print(f"\n? TX[{indice_a_probar}] esta en el arbol? {resultado}")
print(f"Nodos consultados para verificar: {len(prueba)} de {len(transacciones)} totales")
