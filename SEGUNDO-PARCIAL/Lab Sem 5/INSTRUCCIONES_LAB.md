# Laboratorio — Arquitectura y Economía de la EVM
**Materia:** Blockchain y Bases de Datos Distribuidas | **Carrera:** Ciberseguridad y Desarrollo de Software
**Tema:** Ethereum como computadora mundial basada en estados

---

## Propósito

Al terminar este laboratorio serás capaz de:

- Identificar las tres áreas de datos de la EVM y explicar por qué tienen costos distintos
- Compilar y desplegar un contrato en Remix, inspeccionar su bytecode e identificar opcodes
- Calcular el costo real de una transacción bajo el modelo EIP-1559
- Demostrar cómo el Merkle Patricia Trie permite verificar datos sin descargar toda la cadena

**Caso guía:** Tu equipo está auditando un contrato inteligente antes de desplegarlo en producción. El cliente pregunta por qué una función "sencilla" cuesta diez veces más gas que otra de aspecto similar, y por qué si la transacción falla igual se cobra una tarifa. Tu trabajo es responder con evidencia técnica, no con explicaciones genéricas.

---

## Requisitos

- Navegador web con acceso a [https://remix.ethereum.org](https://remix.ethereum.org)
- Acceso a [https://etherscan.io](https://etherscan.io)
- Python 3 instalado
- Sin instalaciones adicionales

---

## Parte 1 — La EVM como máquina de estados

Antes de escribir código, investiga y responde en tu reporte:

¿Cuál es la diferencia entre una cuenta de propietario externo (EOA) y una cuenta de contrato en Ethereum? ¿Qué campo tiene una cuenta de contrato que una EOA no tiene?

Ethereum no almacena transacciones como registros finales: almacena **estados**. Cada transacción es una función de transición `σ' = Υ(σ, T)` donde `σ` es el estado actual y `T` es la transacción. Con eso en mente, responde: si una transacción falla por Out-of-Gas a mitad de ejecución, ¿cuál es el estado resultante `σ'`? ¿Por qué?

---

## Parte 2 — Despliega un contrato y observa su bytecode

**Paso 2.1 — Crea el contrato**

Abre Remix IDE en [https://remix.ethereum.org](https://remix.ethereum.org). En la carpeta `contracts`, crea un archivo llamado `EstadoEVM.sol` con el siguiente código:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EstadoEVM {

    // Storage: persistente en la blockchain
    uint256 public contadorStorage;
    mapping(address => uint256) public saldos;

    // Escribe en Storage (costoso)
    function incrementarStorage() public {
        contadorStorage += 1;
    }

    // Trabaja solo en Memory y retorna el resultado (barato)
    function calcularEnMemoria(uint256 n) public pure returns (uint256) {
        uint256 resultado = 0;
        for (uint256 i = 0; i < n; i++) {
            resultado += i;
        }
        return resultado;
    }

    // Recibe parámetros via Calldata (inmutable durante la llamada)
    function registrarSaldo(address cuenta, uint256 monto) public {
        saldos[cuenta] = monto;
    }
}
```

**Paso 2.2 — Compila e inspecciona el bytecode**

En el panel de Solidity Compiler de Remix:
- Selecciona versión `0.8.19`
- Activa la opción "Enable optimization"
- Compila el contrato

Una vez compilado, haz clic en "Compilation Details" y localiza el campo **Bytecode**. Copia los primeros 40 caracteres del campo `object` y pégalos en tu reporte.

Ahora localiza el campo **Opcodes** en el mismo panel. Identifica en la lista los siguientes opcodes y anota qué número de posición tienen en la secuencia: `PUSH1`, `MSTORE`, `SSTORE`. Si alguno no aparece directamente, investiga en [https://www.evm.codes](https://www.evm.codes) qué hace cada uno y cuál es su costo en gas.

¿Por qué el bytecode que acabas de ver es diferente al código Solidity que escribiste? ¿Qué paso intermedio ocurre entre ambos?

> Captura obligatoria: panel de Remix con el campo Opcodes visible.

**Paso 2.3 — Distingue initcode de runtime bytecode**

En Remix, despliega el contrato en la red **JavaScript VM (Shanghai)**. No necesitas ETH real.

Después del despliegue, en la consola de Remix aparecerá la transacción de creación. Haz clic en ella y localiza los campos `input` y `from`. El campo `input` contiene el **initcode** completo.

Investiga: ¿qué parte del `input` corresponde al initcode de despliegue y qué parte al runtime bytecode que quedará almacenado en la dirección del contrato? ¿Por qué el initcode se ejecuta una sola vez y nunca más?

---

## Parte 3 — Costo de las áreas de datos: Storage vs Memory

Con el contrato desplegado en Remix, ejecuta las siguientes funciones desde el panel **Deploy & Run** y anota el gas consumido que aparece en la consola para cada llamada:

**Llamada 1:** `incrementarStorage()` — escribe en Storage
**Llamada 2:** `calcularEnMemoria(10)` — trabaja en Memory con n=10
**Llamada 3:** `calcularEnMemoria(50)` — trabaja en Memory con n=50
**Llamada 4:** `incrementarStorage()` por segunda vez

Registra los cuatro valores de gas en tu reporte. Con esos datos responde:

- ¿Cuánto más costosa es una escritura en Storage comparada con un cálculo en Memory?
- La cuarta llamada (`incrementarStorage()` por segunda vez) debería costar menos gas que la primera. ¿Lo hace? Investiga por qué el opcode `SSTORE` tiene un costo diferente cuando modifica un slot que ya fue inicializado versus uno que estaba en cero.
- Si el servidor web del caso guía guarda cada petición de usuario en Storage, ¿qué problema económico enfrentará a escala? ¿Qué alternativa arquitectónica existe?

> Captura obligatoria: consola de Remix con las cuatro transacciones y sus costos de gas visibles.

---

## Parte 4 — El problema de parada y el gas como solución

**Paso 4.1 — Crea un contrato con bucle controlable**

Crea un nuevo archivo `BucleGas.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BucleGas {
    uint256 public acumulador;

    function bucle(uint256 iteraciones) public {
        for (uint256 i = 0; i < iteraciones; i++) {
            acumulador += i;
        }
    }
}
```

Compila y despliega en JavaScript VM.

**Paso 4.2 — Mide el costo por iteración**

Ejecuta `bucle` con los siguientes valores y anota el gas consumido en cada caso:

| Iteraciones | Gas consumido | Gas por iteración |
|---|---|---|
| 10 | | |
| 100 | | |
| 1000 | | |

Calcula el gas por iteración dividiendo el gas total entre las iteraciones. ¿Es constante? ¿Por qué sí o por qué no?

**Paso 4.3 — Simula un Out-of-Gas**

En el panel de Remix, antes de ejecutar `bucle(5000)`, cambia manualmente el campo **Gas Limit** a `50000`. Ejecuta la función y observa el resultado en la consola.

Con la salida que obtengas, responde:
- ¿Qué mensaje de error aparece?
- ¿Cuál es el valor de `acumulador` después de la transacción fallida? Llama a la función pública para verificarlo.
- ¿Por qué Ethereum cobra gas aunque la transacción haya fallado? Argumenta desde la perspectiva del validador, no del usuario.
- ¿Cómo resuelve el gas el "Problema de Parada" de Turing? Investiga el problema original y explica la conexión en dos párrafos.

> Captura obligatoria: consola de Remix mostrando el error Out-of-Gas y el estado del acumulador después del fallo.

---

## Parte 5 — EIP-1559: calcula el costo real de una transacción

Abre [https://etherscan.io](https://etherscan.io) y busca cualquier transacción reciente de tipo **Contract Interaction** (puedes encontrar una en la pestaña de transacciones de cualquier bloque reciente).

En la página de la transacción, localiza y registra los siguientes campos:

| Campo | Valor que encontraste |
|---|---|
| Gas Limit | |
| Gas Used | |
| Base Fee Per Gas (Gwei) | |
| Max Priority Fee Per Gas (Gwei) | |
| Max Fee Per Gas (Gwei) | |
| Transaction Fee (ETH) | |

Con esos valores, verifica manualmente la tarifa usando la fórmula EIP-1559:

```
Tarifa efectiva por gas = Base Fee + Priority Fee
Tarifa total = Tarifa efectiva × Gas Used
```

¿Tu cálculo coincide con el campo Transaction Fee de Etherscan? Si hay diferencia, ¿a qué se debe?

Ahora responde:
- ¿Cuánto ETH se quemó en esa transacción (la parte correspondiente al Base Fee)?
- ¿Cuánto ETH recibió el validador como incentivo?
- Si el usuario hubiera establecido un `Max Fee Per Gas` igual al `Base Fee` sin margen, ¿qué habría pasado con su transacción cuando el Base Fee subió en el siguiente bloque?

Investiga en qué bloque histórico se implementó EIP-1559 y anota el número de bloque con su fuente.

> Captura obligatoria: página de la transacción en Etherscan con todos los campos de gas visibles.

---

## Parte 6 — Merkle Patricia Trie: verifica sin descargar toda la cadena

Crea el archivo `merkle.py` en tu carpeta de trabajo:

```python
import hashlib

def sha256d(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def hash_par(a: str, b: str) -> str:
    combined = bytes.fromhex(a) + bytes.fromhex(b)
    return sha256d(combined)

def construir_arbol(hojas: list) -> list:
    if len(hojas) % 2 == 1:
        hojas.append(hojas[-1])  # Duplica la última hoja si el número es impar
    
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
        hermano = indice ^ 1  # XOR para obtener el índice del hermano
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

print(f"\nNiveles del árbol: {len(niveles)}")
for i, nivel in enumerate(niveles):
    etiqueta = "Raíz" if i == len(niveles) - 1 else f"Nivel {i}"
    print(f"  {etiqueta}: {[h[:12] + '...' for h in nivel]}")

raiz = niveles[-1][0]
print(f"\nRaíz Merkle: {raiz}")

# Genera y verifica la prueba de inclusión para TX[1]
indice_a_probar = 1
prueba = prueba_inclusion(niveles, indice_a_probar)

print(f"\n=== PRUEBA DE INCLUSIÓN PARA TX[{indice_a_probar}] ===")
print(f"Hoja: {transacciones[indice_a_probar][:20]}...")
print("Nodos de la prueba:")
for nodo, pos in prueba:
    print(f"  Hermano ({pos}): {nodo[:20]}...")

resultado = verificar_prueba(transacciones[indice_a_probar], prueba, raiz)
print(f"\n¿TX[{indice_a_probar}] está en el árbol? {resultado}")
print(f"Nodos consultados para verificar: {len(prueba)} de {len(transacciones)} totales")
```

Ejecuta el script:

```bash
python merkle.py
```

Con la salida que obtuviste, responde:

- ¿Cuántos nodos necesitó consultar el algoritmo para verificar que TX[1] estaba en el árbol? ¿Cuántas transacciones tiene el árbol total?
- Si el árbol tuviera 1,024 transacciones, ¿cuántos nodos necesitarías consultar para verificar una sola? ¿Qué complejidad algorítmica es esa?
- Un nodo ligero (light client) de Ethereum no descarga todas las transacciones de cada bloque, solo la raíz Merkle del encabezado. ¿Cómo puede ese nodo verificar que una transacción específica existió sin tener el bloque completo?

**Paso 6.2 — Verifica con datos reales**

Regresa a Etherscan y abre cualquier bloque reciente. Localiza el campo **Transactions Root** en los detalles del bloque. Anota ese valor en tu reporte.

¿Ese campo es la raíz Merkle de qué datos exactamente? Investiga los tres tries que componen el encabezado de un bloque Ethereum y describe brevemente qué contiene cada uno.

> Captura obligatoria: salida completa del script en tu terminal y página del bloque en Etherscan con el campo Transactions Root visible.

---

## Parte 7 — Reflexión final

Responde con base en lo que ejecutaste e investigaste:

1. En la Parte 3 mediste que Storage es mucho más costoso que Memory. En la Parte 5 calculaste la tarifa real de una transacción en Etherscan. Si esa transacción hubiera ejecutado diez escrituras adicionales en Storage, ¿cuánto ETH extra habría costado aproximadamente? Muestra el cálculo usando el precio de gas que encontraste y el costo del opcode SSTORE.

2. En la Parte 4 comprobaste que un Out-of-Gas revierte todos los cambios pero cobra gas. Un atacante decide enviar transacciones diseñadas para fallar justo antes de agotar el gas, esperando saturar la red sin pagar mucho. ¿Por qué el modelo de tarifas de EIP-1559 hace este ataque económicamente inviable comparado con el modelo anterior?

3. Con todo lo que observaste en el laboratorio, explica en un párrafo técnico por qué Ethereum se describe como "quasi-Turing completo" y no simplemente "Turing completo". ¿Qué implicación tiene eso para la seguridad de la red?

---

## Checklist de cierre

Antes de entregar verifica:

- [ ] Bytecode y opcodes del contrato identificados en Remix (captura)
- [ ] Distinción initcode vs runtime bytecode explicada con evidencia de la consola
- [ ] Cuatro valores de gas de la Parte 3 registrados desde tu propia ejecución
- [ ] Out-of-Gas simulado con estado del acumulador verificado (captura)
- [ ] Campos EIP-1559 de una transacción real registrados y tarifa recalculada manualmente
- [ ] Script Merkle ejecutado con salida completa (captura)
- [ ] Transactions Root del bloque en Etherscan anotado (captura)
- [ ] Tres preguntas de reflexión respondidas con datos propios del laboratorio

---

**Entregable:** Reporte APA 7 con capturas de pantalla de tu equipo en cada sección indicada y declaración de uso de IA.
