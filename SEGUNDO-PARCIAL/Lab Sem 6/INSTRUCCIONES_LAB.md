# Laboratorio — Desarrollo en Solidity (Fundamentos)

**Materia:** Blockchain y Bases de Datos Distribuidas | **Carrera:** Ciberseguridad y Desarrollo de Software
**Tema:** Contratos inteligentes básicos: tipos de datos y lógica de control

---

## Propósito

Al terminar este laboratorio serás capaz de:

- Declarar y usar los tipos de datos primitivos de Solidity en un contrato funcional
- Distinguir variables de estado, variables locales y su impacto en gas
- Implementar lógica de control con `if/else`, `for`, `require` y `revert`
- Usar funciones con distintos modificadores de visibilidad y estado

**Caso guía:** Una cooperativa de ahorro necesita un sistema básico para registrar socios, gestionar depósitos y consultar saldos. No existe intermediario: las reglas están escritas en código. Tu tarea es construir ese sistema desde cero en Solidity.

---

## Requisitos

- Remix IDE: [https://remi`MayorSaldo_Resultado.`x.ethereum.org](https://remix.ethereum.org)
- Red: JavaScript VM (Shanghai)
- Sin instalaciones adicionales

---

## Parte 1 — Tipos de datos primitivos

**Paso 1.1 — Declara variables de distintos tipos**

En Remix crea el archivo `TiposDatos.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TiposDatos {

    // Enteros sin signo
    uint8  public edadMaxima   = 255;
    uint256 public totalSocios = 0;

    // Entero con signo
    int256 public temperatura  = -15;

    // Booleano
    bool public aceptandoSocios = true;

    // Dirección
    address public administrador;

    // Cadena de texto
    string public nombreCooperativa = "Cooperativa Lab";

    // Bytes fijos
    bytes32 public codigoInterno = "COO-2025-MX";

    constructor() {
        administrador = msg.sender;
    }

    function cambiarEstado(bool estado) public {
        aceptandoSocios = estado;
    }

    function incrementarSocios() public {
        totalSocios += 1;
    }
}
```

Compila y despliega. Ejecuta cada variable pública y anota el valor que retorna en tu reporte.

Antes de continuar, investiga: ¿qué diferencia hay entre `uint8` y `uint256` en términos de rango de valores y costo de gas? ¿Por qué Solidity recomienda usar `uint256` sobre `uint8` en la mayoría de los casos aunque ocupe más espacio?

Llama `cambiarEstado(false)` y luego `cambiarEstado(true)`. Anota el gas consumido en cada llamada. ¿Son iguales? ¿Por qué?

> Captura obligatoria: panel de Remix con los valores de todas las variables visibles después del despliegue.

---

## Parte 2 — Variables de estado vs variables locales

**Paso 2.1 — Observa la diferencia en gas**

Crea `AlmacenamientoGas.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AlmacenamientoGas {

    // Variable de estado: vive en Storage (persistente, costosa)
    uint256 public resultadoStorage;

    // Escribe el resultado en Storage
    function calcularEnStorage(uint256 a, uint256 b) public {
        resultadoStorage = a * b + a - b;
    }

    // Calcula en memoria y retorna sin escribir en Storage
    function calcularEnMemoria(uint256 a, uint256 b) public pure returns (uint256) {
        uint256 resultado = a * b + a - b;
        return resultado;
    }

    // Usa una variable local como acumulador sin guardarla
    function sumarRango(uint256 limite) public pure returns (uint256) {
        uint256 acumulador = 0;
        for (uint256 i = 1; i <= limite; i++) {
            acumulador += i;
        }
        return acumulador;
    }
}
```

Despliega y ejecuta las tres funciones con `a = 12`, `b = 5` y `limite = 10`. Anota el gas consumido por cada llamada.

Con esos valores responde:

- ¿Cuánto más costosa es `calcularEnStorage` frente a `calcularEnMemoria`?
- `sumarRango` no escribe en Storage pero consume más gas que `calcularEnMemoria`. ¿Por qué?
- ¿Qué modificador de función garantiza que una función nunca lee ni escribe en Storage? ¿Cuál permite leer pero no escribir?

> Captura obligatoria: consola con las tres llamadas y sus valores de gas.

---

## Parte 3 — Lógica de control y validaciones

**Paso 3.1 — Implementa un sistema de registro con restricciones**

Crea `RegistroSocios.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RegistroSocios {

    address public administrador;
    bool public registroAbierto;
    uint256 public cuotaMinima;
    uint256 public totalSocios;

    mapping(address => bool) public esSocio;
    mapping(address => uint256) public aportacion;
    address[] public listaSocios;

    event SocioRegistrado(address socio, uint256 aportacion);
    event RegistroCerrado();

    constructor(uint256 _cuotaMinima) {
        administrador = msg.sender;
        cuotaMinima = _cuotaMinima;
        registroAbierto = true;
    }

    function registrarse(uint256 monto) public {
        require(registroAbierto, "El registro esta cerrado");
        require(!esSocio[msg.sender], "Ya eres socio");
        require(monto >= cuotaMinima, "Aportacion menor a la cuota minima");

        esSocio[msg.sender] = true;
        aportacion[msg.sender] = monto;
        listaSocios.push(msg.sender);
        totalSocios += 1;

        emit SocioRegistrado(msg.sender, monto);
    }

    function cerrarRegistro() public {
        require(msg.sender == administrador, "Solo el administrador");
        require(registroAbierto, "Ya esta cerrado");
        registroAbierto = false;
        emit RegistroCerrado();
    }

    function consultarSocio(address cuenta) public view returns (bool, uint256) {
        return (esSocio[cuenta], aportacion[cuenta]);
    }

    function obtenerTodos() public view returns (address[] memory) {
        return listaSocios;
    }
}
```

Despliega con `cuotaMinima = 100`. Ejecuta la siguiente secuencia desde distintas cuentas y anota resultado y gas de cada operación:

1. `registrarse(100)` desde cuenta A — registro válido
2. `registrarse(100)` desde cuenta A nuevamente — ya es socio
3. `registrarse(50)` desde cuenta B — aportación insuficiente
4. `registrarse(200)` desde cuenta B — registro válido
5. `cerrarRegistro()` desde cuenta B — no es administrador
6. `cerrarRegistro()` desde cuenta A (administrador)
7. `registrarse(100)` desde cuenta C — registro cerrado

Con la secuencia que ejecutaste, responde:

- ¿Cuál es la diferencia entre `require` y un `if/else` para validar condiciones en Solidity? ¿Cuándo conviene usar cada uno?
- Los pasos 2, 3, 5 y 7 fallaron. ¿Consumieron gas aunque fallaron? Compara el gas de una llamada exitosa contra una fallida y explica la diferencia.
- ¿Qué hace `emit` y para qué sirven los eventos en un contrato? ¿Dónde puedes ver los eventos emitidos en Remix?

> Captura obligatoria: consola con las siete operaciones y sus resultados visibles.

---

## Parte 4 — Arreglos, mappings y estructuras

**Paso 4.1 — Implementa la lógica de ahorros**

Crea `CajaDeAhorro.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CajaDeAhorro {

    struct Movimiento {
        string tipo;
        uint256 monto;
        uint256 fecha;
    }

    address public administrador;
    mapping(address => uint256) public saldo;
    mapping(address => Movimiento[]) private historial;
    uint256 public totalEnCaja;

    event Deposito(address cuenta, uint256 monto);
    event Retiro(address cuenta, uint256 monto);

    constructor() {
        administrador = msg.sender;
    }

    function depositar(uint256 monto) public {
        require(monto > 0, "Monto debe ser mayor a cero");

        saldo[msg.sender] += monto;
        totalEnCaja += monto;

        historial[msg.sender].push(Movimiento("deposito", monto, block.timestamp));
        emit Deposito(msg.sender, monto);
    }

    function retirar(uint256 monto) public {
        require(monto > 0, "Monto debe ser mayor a cero");
        require(saldo[msg.sender] >= monto, "Saldo insuficiente");

        saldo[msg.sender] -= monto;
        totalEnCaja -= monto;

        historial[msg.sender].push(Movimiento("retiro", monto, block.timestamp));
        emit Retiro(msg.sender, monto);
    }

    function obtenerHistorial(address cuenta)
        public view returns (Movimiento[] memory)
    {
        return historial[cuenta];
    }

    function contarMovimientos(address cuenta) public view returns (uint256) {
        return historial[cuenta].length;
    }

    function calcularPromedio(address cuenta) public view returns (uint256) {
        Movimiento[] memory movs = historial[cuenta];
        require(movs.length > 0, "Sin movimientos");

        uint256 suma = 0;
        for (uint256 i = 0; i < movs.length; i++) {
            suma += movs[i].monto;
        }
        return suma / movs.length;
    }
}
```

Despliega y ejecuta la siguiente secuencia desde cuenta A:

1. `depositar(500)`
2. `depositar(300)`
3. `retirar(200)`
4. `depositar(100)`
5. `retirar(800)` — saldo insuficiente
6. `contarMovimientos(cuenta_A)`
7. `calcularPromedio(cuenta_A)`
8. `obtenerHistorial(cuenta_A)`

Anota en tu reporte:

- ¿Cuántos movimientos registró el contrato? ¿Incluye el paso 5 que falló?
- ¿Qué valor retornó `calcularPromedio`? Verifica el cálculo manualmente con los montos que depositaste y retiraste.
- ¿Qué es un `struct` en Solidity y qué ventaja tiene frente a usar variables separadas para cada campo?
- La función `obtenerHistorial` retorna `Movimiento[] memory`. ¿Por qué se usa `memory` aquí y no `storage`?

> Captura obligatoria: salida de `obtenerHistorial` mostrando el arreglo de movimientos de tu cuenta.

---

## Parte 5 — Integra todo en el sistema de la cooperativa

**Paso 5.1 — Contrato final**

Crea `Cooperativa.sol` que integra registro de socios y caja de ahorro en un solo contrato:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Cooperativa {

    struct Socio {
        string nombre;
        uint256 saldo;
        bool activo;
        uint256 fechaIngreso;
    }

    address public administrador;
    uint256 public cuotaIngreso;
    uint256 public totalSocios;
    uint256 public fondoComun;

    mapping(address => Socio) public socios;
    address[] private direccionesSocios;

    event NuevoSocio(address cuenta, string nombre);
    event DepositoRealizado(address cuenta, uint256 monto);
    event RetiroRealizado(address cuenta, uint256 monto);

    constructor(uint256 _cuota) {
        administrador = msg.sender;
        cuotaIngreso = _cuota;
    }

    function unirse(string memory nombre, uint256 aportacionInicial) public {
        require(!socios[msg.sender].activo, "Ya eres socio");
        require(aportacionInicial >= cuotaIngreso, "Aportacion insuficiente");
        require(bytes(nombre).length > 0, "Nombre requerido");

        socios[msg.sender] = Socio(nombre, aportacionInicial, true, block.timestamp);
        direccionesSocios.push(msg.sender);
        fondoComun += aportacionInicial;
        totalSocios++;

        emit NuevoSocio(msg.sender, nombre);
    }

    function depositar(uint256 monto) public {
        require(socios[msg.sender].activo, "No eres socio");
        require(monto > 0, "Monto invalido");

        socios[msg.sender].saldo += monto;
        fondoComun += monto;

        emit DepositoRealizado(msg.sender, monto);
    }

    function retirar(uint256 monto) public {
        require(socios[msg.sender].activo, "No eres socio");
        require(socios[msg.sender].saldo >= monto, "Saldo insuficiente");
        require(monto > 0, "Monto invalido");

        socios[msg.sender].saldo -= monto;
        fondoComun -= monto;

        emit RetiroRealizado(msg.sender, monto);
    }

    function consultarSocio(address cuenta)
        public view returns (string memory, uint256, bool, uint256)
    {
        Socio memory s = socios[cuenta];
        return (s.nombre, s.saldo, s.activo, s.fechaIngreso);
    }

    function socionConMayorSaldo() public view returns (address, uint256) {
        require(totalSocios > 0, "Sin socios registrados");

        address mejor = direccionesSocios[0];
        uint256 mayorSaldo = socios[mejor].saldo;

        for (uint256 i = 1; i < direccionesSocios.length; i++) {
            if (socios[direccionesSocios[i]].saldo > mayorSaldo) {
                mayorSaldo = socios[direccionesSocios[i]].saldo;
                mejor = direccionesSocios[i];
            }
        }
        return (mejor, mayorSaldo);
    }
}
```

Ejecuta el flujo completo con al menos tres cuentas distintas en Remix:

1. Registra tres socios con nombres y aportaciones distintas
2. Realiza depósitos y retiros desde al menos dos cuentas
3. Llama `socionConMayorSaldo()` y verifica que el resultado coincide con tus datos
4. Intenta registrar a un socio dos veces
5. Intenta retirar más del saldo disponible

Registra en tu reporte el gas de cada operación y responde:

- ¿Por qué `socionConMayorSaldo` consume más gas cuantos más socios haya? ¿Qué complejidad algorítmica tiene ese recorrido?
- Si la cooperativa tuviera 10,000 socios y llamaras `socionConMayorSaldo`, ¿qué problema podría surgir? ¿Cómo lo resolverías?

> Captura obligatoria: consola con el flujo completo y resultado de `socionConMayorSaldo`.

---

## Checklist de cierre

Antes de entregar verifica:

- [ ] Valores de todas las variables de `TiposDatos` capturados después del despliegue
- [ ] Gas de las tres funciones de `AlmacenamientoGas` registrado y comparado
- [ ] Secuencia de siete operaciones en `RegistroSocios` documentada con resultados
- [ ] Salida de `obtenerHistorial` con movimientos reales de tu cuenta (captura)
- [ ] `calcularPromedio` verificado manualmente contra tus depósitos
- [ ] Flujo completo de `Cooperativa` con tres cuentas documentado (captura)
- [ ] `socionConMayorSaldo` verificado contra los datos que ingresaste

---

**Entregable:** Reporte APA 7 con capturas de pantalla de Remix en cada sección indicada y declaración de uso de IA.