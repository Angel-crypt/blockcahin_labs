# Laboratorio — Desarrollo de dApps: Integración Frontend con Web3

**Materia:** Blockchain y Bases de Datos Distribuidas | **Carrera:** Ciberseguridad y Desarrollo de Software
**Tema:** Integración de contratos inteligentes con frontend mediante proveedores Web3 y APIs

---

## Propósito

Al terminar este laboratorio serás capaz de:

- Conectar una interfaz web a MetaMask usando el proveedor EIP-1193 inyectado
- Leer el estado de un contrato desplegado mediante ethers.js v6
- Enviar transacciones firmadas desde el frontend y manejar sus estados
- Manejar los eventos de cambio de cuenta y red que emite el proveedor

**Caso guía:** Tu equipo desplegó un contrato en Sepolia en el laboratorio anterior. Ahora los usuarios finales no pueden interactuar con él porque no existe interfaz: solo puede usarse desde scripts de Hardhat. Tu tarea es construir el frontend que conecta la wallet del usuario con el contrato, permitiendo depósitos y retiros desde el navegador.

---

## Requisitos

- Node.js 18+ y npm
- MetaMask instalado en el navegador
- Contrato `BovedaSegura` desplegado en Sepolia (del laboratorio de despliegue) con su dirección
- ETH de prueba en Sepolia en tu cuenta de MetaMask

**Nota de versiones — verificada contra documentación oficial:** Este laboratorio usa **ethers.js v6**. La API de v6 difiere de v5: `BrowserProvider` reemplaza a `Web3Provider`, y los métodos que antes eran síncronos ahora retornan promesas. Si copias código de tutoriales de v5, no funcionará.

Verifica tu entorno:

```bash
node --version
npm --version
```

Anota ambas versiones en tu reporte.

---

## Ancla de sesión

Antes de comenzar, ejecuta en tu terminal:

```bash
echo "SESION: $(date '+%Y%m%d_%H%M%S') | NODE: $(node --version) | NPM: $(npm --version) | USUARIO: $(whoami)"
```

Copia la línea en la primera página de tu reporte. Entregas sin este valor son inválidas.

---

## Parte 1 — Inicializa el proyecto frontend

**Paso 1.1 — Crea el proyecto con Vite**

Create React App está descontinuado. El estándar actual para proyectos frontend es Vite.

```bash
npm create vite@latest dapp-frontend -- --template vanilla
cd dapp-frontend
npm install
```

Instala ethers.js v6:

```bash
npm install ethers
```

Verifica la versión instalada:

```bash
npm list ethers
```

Anota la versión exacta en tu reporte. Debe ser 6.x. Si es 5.x, desinstala con `npm uninstall ethers` y vuelve a instalar.

Antes de continuar, investiga y responde en tu reporte: ¿qué es un "proveedor" (provider) en el contexto de ethers.js? ¿En qué se diferencia un `Provider` de un `Signer`? Uno de los dos puede firmar transacciones y el otro no — identifica cuál y por qué.

**Paso 1.2 — Prueba que Vite funciona**

```bash
npm run dev
```

Abre la URL que muestra la terminal (normalmente `http://localhost:5173`). Verifica que la página de Vite carga. Detén el servidor con Ctrl+C.

> Captura obligatoria: página de Vite corriendo en tu navegador con la URL visible.

---

## Parte 2 — Detecta y conecta MetaMask

**Paso 2.1 — Reemplaza el HTML base**

Sustituye el contenido de `index.html` por:

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>dApp Bóveda Segura</title>
  </head>
  <body>
    <div id="app">
      <h1>Bóveda Segura — Interfaz Web3</h1>

      <section id="conexion">
        <button id="btnConectar">Conectar MetaMask</button>
        <p id="estadoConexion">No conectado</p>
        <p id="cuentaActual"></p>
        <p id="redActual"></p>
      </section>

      <hr />

      <section id="interaccion" style="display:none">
        <h2>Estado del contrato</h2>
        <p>Tu saldo en la bóveda: <span id="saldoUsuario">-</span> ETH</p>
        <p>Balance total del contrato: <span id="balanceContrato">-</span> ETH</p>
        <button id="btnActualizar">Actualizar saldos</button>

        <h2>Depositar</h2>
        <input id="montoDeposito" type="text" placeholder="0.01" />
        <button id="btnDepositar">Depositar ETH</button>

        <h2>Retirar</h2>
        <input id="montoRetiro" type="text" placeholder="0.005" />
        <button id="btnRetirar">Retirar ETH</button>

        <div id="log"></div>
      </section>
    </div>
    <script type="module" src="/main.js"></script>
  </body>
</html>
```

**Paso 2.2 — Implementa la detección del proveedor**

Crea `main.js` (reemplaza el existente):

```javascript
import { BrowserProvider, Contract, formatEther, parseEther } from "ethers";

// Dirección del contrato desplegado en Sepolia (del laboratorio anterior)
const DIRECCION_CONTRATO = "0xTU_DIRECCION_DE_SEPOLIA";

// ABI mínima: solo las funciones que usa el frontend
const ABI_CONTRATO = [
  "function depositar() external payable",
  "function retirar(uint256 monto) external",
  "function consultarSaldo(address cuenta) external view returns (uint256)",
  "function balanceContrato() external view returns (uint256)",
  "event Deposito(address indexed cuenta, uint256 monto)",
  "event Retiro(address indexed cuenta, uint256 monto)"
];

const CHAIN_ID_SEPOLIA = "0xaa36a7"; // 11155111 en hexadecimal

let provider = null;
let signer = null;
let contrato = null;

function log(mensaje) {
  const logDiv = document.getElementById("log");
  const p = document.createElement("p");
  p.textContent = `[${new Date().toLocaleTimeString()}] ${mensaje}`;
  logDiv.prepend(p);
}

// Detecta si MetaMask está disponible mediante el proveedor inyectado EIP-1193
function detectarMetaMask() {
  if (typeof window.ethereum !== "undefined") {
    log("MetaMask detectado");
    return true;
  }
  document.getElementById("estadoConexion").textContent =
    "MetaMask no está instalado";
  log("MetaMask NO detectado — instálalo desde metamask.io");
  return false;
}

// Conecta la wallet solicitando acceso a las cuentas
async function conectar() {
  if (!detectarMetaMask()) return;

  try {
    // Solicita permiso al usuario para acceder a sus cuentas
    provider = new BrowserProvider(window.ethereum);
    const cuentas = await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();

    const direccion = await signer.getAddress();
    const red = await provider.getNetwork();

    document.getElementById("estadoConexion").textContent = "Conectado";
    document.getElementById("cuentaActual").textContent =
      `Cuenta: ${direccion}`;
    document.getElementById("redActual").textContent =
      `Red: ${red.name} (chainId: ${red.chainId})`;

    log(`Conectado como ${direccion}`);

    // Verifica que estamos en Sepolia
    if (red.chainId !== 11155111n) {
      log("ADVERTENCIA: no estás en Sepolia. Cambia de red en MetaMask.");
    }

    // Instancia el contrato con el signer (permite lectura y escritura)
    contrato = new Contract(DIRECCION_CONTRATO, ABI_CONTRATO, signer);

    document.getElementById("interaccion").style.display = "block";
    await actualizarSaldos();

  } catch (error) {
    log(`Error al conectar: ${error.message}`);
  }
}

document.getElementById("btnConectar").addEventListener("click", conectar);

// Se completa en las siguientes partes
async function actualizarSaldos() {
  log("actualizarSaldos aún no implementado");
}
```

Reemplaza `DIRECCION_CONTRATO` con la dirección real de tu contrato en Sepolia.

Ejecuta `npm run dev`, abre la página y haz clic en "Conectar MetaMask". MetaMask debe abrir un diálogo pidiendo permiso.

Anota en tu reporte:

- La dirección de cuenta que aparece al conectar
- El `chainId` que muestra la interfaz
- Si aparece la advertencia de red, ¿en qué red estabas?

Antes de continuar, responde: la función usa `provider.send("eth_requestAccounts", [])`. Investiga qué es `eth_requestAccounts` y por qué el método `request` del proveedor requiere interacción del usuario (un clic) y no puede llamarse automáticamente al cargar la página. ¿Qué problema de seguridad previene esa restricción?

> Captura obligatoria: MetaMask abriendo el diálogo de conexión y la interfaz mostrando tu cuenta conectada.

---

## Parte 3 — Lee el estado del contrato

**Paso 3.1 — Implementa la lectura de saldos**

Reemplaza la función `actualizarSaldos` vacía por:

```javascript
async function actualizarSaldos() {
  if (!contrato || !signer) {
    log("Conecta primero tu wallet");
    return;
  }

  try {
    const direccion = await signer.getAddress();

    // Llamada de solo lectura — no cuesta gas
    const saldoWei = await contrato.consultarSaldo(direccion);
    const balanceWei = await contrato.balanceContrato();

    // Convierte de wei a ETH para mostrar
    document.getElementById("saldoUsuario").textContent =
      formatEther(saldoWei);
    document.getElementById("balanceContrato").textContent =
      formatEther(balanceWei);

    log(`Saldo actualizado: ${formatEther(saldoWei)} ETH`);
  } catch (error) {
    log(`Error al leer saldos: ${error.message}`);
  }
}

document.getElementById("btnActualizar")
  .addEventListener("click", actualizarSaldos);
```

Guarda, recarga la página, conecta y observa los saldos.

Con lo que ves en la interfaz, responde:

- ¿Cuál es tu saldo actual en la bóveda? ¿Coincide con lo que depositaste en el laboratorio anterior desde Hardhat?
- La función `consultarSaldo` es una llamada `view`. Abre las herramientas de desarrollo del navegador (F12) → pestaña Network. Al hacer clic en "Actualizar saldos", ¿aparece alguna petición? ¿A qué URL se dirige?

Antes de continuar, investiga: las llamadas `view` no cuestan gas ni requieren firma. ¿A través de qué mecanismo obtiene ethers.js el resultado sin enviar una transacción a la blockchain? ¿Qué método RPC de Ethereum se usa por debajo (pista: empieza con `eth_call`)?

**Afirmación para refutar o confirmar:** *"Cada vez que el frontend lee el saldo del contrato con `consultarSaldo`, esa lectura queda registrada permanentemente en la blockchain."*

Con lo que investigaste sobre `eth_call` y las llamadas `view`, refuta o confirma esta afirmación.

> Captura obligatoria: interfaz mostrando tu saldo real leído del contrato en Sepolia.

---

## Parte 4 — Envía transacciones firmadas

**Paso 4.1 — Implementa el depósito**

Agrega a `main.js`:

```javascript
async function depositar() {
  if (!contrato) {
    log("Conecta primero tu wallet");
    return;
  }

  const monto = document.getElementById("montoDeposito").value;
  if (!monto || parseFloat(monto) <= 0) {
    log("Ingresa un monto válido");
    return;
  }

  try {
    log(`Enviando depósito de ${monto} ETH...`);

    // Envía la transacción — MetaMask pedirá confirmación y firma
    const tx = await contrato.depositar({ value: parseEther(monto) });

    log(`Transacción enviada. Hash: ${tx.hash}`);
    log("Esperando confirmación en la red...");

    // Espera a que la transacción sea minada
    const recibo = await tx.wait();

    log(`Confirmada en el bloque ${recibo.blockNumber}`);
    log(`Gas usado: ${recibo.gasUsed.toString()}`);

    await actualizarSaldos();
  } catch (error) {
    // Maneja el rechazo del usuario y otros errores
    if (error.code === "ACTION_REJECTED") {
      log("Transacción rechazada por el usuario");
    } else {
      log(`Error en el depósito: ${error.message}`);
    }
  }
}

document.getElementById("btnDepositar").addEventListener("click", depositar);
```

Deposita 0.01 ETH desde la interfaz. MetaMask pedirá que firmes la transacción.

Anota en tu reporte:

- El hash de la transacción que aparece en el log
- El número de bloque en que se confirmó
- El gas usado
- El tiempo aproximado entre "enviada" y "confirmada"

Abre el hash en `TU_HASH` y verifica que la transacción coincide con lo que muestra tu interfaz.

**Paso 4.2 — Implementa el retiro**

Agrega:

```javascript
async function retirar() {
  if (!contrato) {
    log("Conecta primero tu wallet");
    return;
  }

  const monto = document.getElementById("montoRetiro").value;
  if (!monto || parseFloat(monto) <= 0) {
    log("Ingresa un monto válido");
    return;
  }

  try {
    log(`Solicitando retiro de ${monto} ETH...`);
    const tx = await contrato.retirar(parseEther(monto));
    log(`Transacción enviada. Hash: ${tx.hash}`);

    const recibo = await tx.wait();
    log(`Retiro confirmado en el bloque ${recibo.blockNumber}`);
    log(`Gas usado: ${recibo.gasUsed.toString()}`);

    await actualizarSaldos();
  } catch (error) {
    if (error.code === "ACTION_REJECTED") {
      log("Transacción rechazada por el usuario");
    } else {
      log(`Error en el retiro: ${error.message}`);
    }
  }
}

document.getElementById("btnRetirar").addEventListener("click", retirar);
```

Retira 0.005 ETH. Registra en tu reporte el hash, bloque y gas.

Compara el gas usado en el depósito contra el del retiro. ¿Cuál consumió más? Con lo que sabes del contrato (el retiro tiene el modificador `nonReentrant` y hace una transferencia externa), explica la diferencia.

> Captura obligatoria: log de la interfaz con los hashes de depósito y retiro, y ambas transacciones en Sepolia Etherscan.

---

## Parte 5 — Maneja eventos del proveedor

Una dApp robusta debe reaccionar cuando el usuario cambia de cuenta o de red en MetaMask sin recargar la página.

**Paso 5.1 — Implementa los listeners de eventos**

Agrega al final de `main.js`:

```javascript
// El proveedor EIP-1193 emite eventos cuando cambia el estado de la wallet
if (typeof window.ethereum !== "undefined") {

  // Se dispara cuando el usuario cambia de cuenta en MetaMask
  window.ethereum.on("accountsChanged", async (cuentas) => {
    if (cuentas.length === 0) {
      log("Wallet desconectada");
      document.getElementById("interaccion").style.display = "none";
      document.getElementById("estadoConexion").textContent = "No conectado";
    } else {
      log(`Cuenta cambiada a: ${cuentas[0]}`);
      // Reconecta con la nueva cuenta
      await conectar();
    }
  });

  // Se dispara cuando el usuario cambia de red en MetaMask
  window.ethereum.on("chainChanged", (chainId) => {
    log(`Red cambiada a chainId: ${chainId}`);
    // La recomendación oficial es recargar la página al cambiar de red
    window.location.reload();
  });
}
```

**Paso 5.2 — Prueba los eventos**

Con la dApp conectada:

1. En MetaMask, cambia a una cuenta diferente. Observa el log de la interfaz.
2. En MetaMask, cambia de red (por ejemplo, a Ethereum Mainnet). Observa qué ocurre.
3. Vuelve a Sepolia.

Anota en tu reporte:

- ¿Qué mensaje apareció en el log al cambiar de cuenta?
- ¿Qué ocurrió con la interfaz al cambiar de red?
- ¿Por qué la recomendación oficial de MetaMask es recargar la página cuando cambia la red en lugar de solo actualizar el estado?

Investiga y responde: este laboratorio detecta MetaMask mediante `window.ethereum` (EIP-1193). La documentación oficial de MetaMask recomienda EIP-6963 para producción. ¿Qué problema específico resuelve EIP-6963 que `window.ethereum` no puede resolver cuando el usuario tiene varias wallets instaladas?

> Captura obligatoria: log de la interfaz mostrando el evento `accountsChanged` después de cambiar de cuenta en MetaMask.

---

## Parte 6 — Escucha eventos del contrato

Los contratos emiten eventos. El frontend puede suscribirse a ellos para actualizar la interfaz en tiempo real cuando ocurre una transacción.

**Paso 6.1 — Suscríbete a los eventos del contrato**

Agrega dentro de la función `conectar()`, justo después de instanciar el contrato:

```javascript
    // Escucha el evento Deposito emitido por el contrato
    contrato.on("Deposito", (cuenta, monto) => {
      log(`EVENTO Deposito: ${cuenta} depositó ${formatEther(monto)} ETH`);
    });

    // Escucha el evento Retiro
    contrato.on("Retiro", (cuenta, monto) => {
      log(`EVENTO Retiro: ${cuenta} retiró ${formatEther(monto)} ETH`);
    });
```

Guarda, recarga, conecta y realiza un depósito nuevo.

Anota en tu reporte:

- ¿Apareció el mensaje "EVENTO Deposito" en el log además del mensaje de confirmación de la transacción?
- ¿En qué momento apareció: antes o después de la confirmación del bloque?

Con lo que observaste, responde: el evento `Deposito` lo emite el contrato en la blockchain, no tu código JavaScript. ¿Cómo se entera tu frontend de que el evento ocurrió? Investiga qué mecanismo usa ethers.js para escuchar eventos (pista: consulta sobre `eth_subscribe` o polling de logs).

> Captura obligatoria: log mostrando el mensaje "EVENTO Deposito" capturado desde el contrato.

---

## Parte 7 — Reflexión final

Responde con base en lo que ejecutaste e investigaste:

1. En la Parte 4 mediste el gas de depósito y retiro desde el frontend. Ese gas es idéntico al que mediste en Hardhat en el laboratorio de despliegue. ¿Por qué el gas de una función no cambia si se llama desde un script de Hardhat, desde el frontend con ethers.js, o desde Etherscan? ¿Qué componente determina el costo de gas y por qué es independiente de la herramienta que envía la transacción?
2. En la Parte 3 confirmaste que las llamadas `view` no cuestan gas y no se registran en la blockchain, mientras que en la Parte 4 el depósito sí cuesta gas y sí queda registrado. Con el hash de tu depósito en Sepolia Etherscan, identifica: ¿quién pagó el gas de esa transacción, el contrato o tu cuenta? Explica por qué el modelo de Ethereum asigna el costo a quien inicia la transacción.
3. Este laboratorio usó ethers.js v6 con `window.ethereum` directamente. Las fuentes actuales recomiendan wagmi + viem para dApps de producción en React. Con base en lo que investigaste sobre EIP-6963 y el manejo de eventos, nombra dos ventajas concretas que aportaría wagmi frente a la implementación manual que hiciste. No es una pregunta de preferencia: identifica qué código repetitivo o propenso a errores de tu implementación resolvería una librería de más alto nivel.

---

## Checklist de cierre

Antes de entregar verifica:

- [ ] Ancla de sesión en la primera página del reporte
- [ ] Versiones de Node, npm y ethers (debe ser 6.x) anotadas
- [ ] Diferencia Provider vs Signer respondida
- [ ] MetaMask conectado mostrando cuenta y chainId (captura)
- [ ] Saldo real del contrato leído desde Sepolia (captura)
- [ ] Afirmación sobre lecturas view refutada o confirmada
- [ ] Hash de depósito con bloque y gas registrados, verificado en Etherscan
- [ ] Hash de retiro con bloque y gas registrados, verificado en Etherscan
- [ ] Comparación de gas depósito vs retiro con explicación
- [ ] Evento accountsChanged capturado al cambiar de cuenta (captura)
- [ ] Evento Deposito del contrato capturado en el log (captura)
- [ ] Tres preguntas de reflexión respondidas con datos del laboratorio

---

**Entregable:** Reporte APA 7 con capturas de la interfaz, MetaMask y Sepolia Etherscan en cada sección indicada, y declaración de uso de IA.
