# GUÍA DE COMANDOS — Laboratorio 9: Integración Frontend con Web3

Este archivo contiene la secuencia ordenada de comandos necesarios para configurar el entorno de desarrollo, inicializar el proyecto frontend con `Vite`, instalar las dependencias con `pnpm`, y levantar el servidor local para realizar las pruebas de conexión con MetaMask y el contrato inteligente.

---

## ANCLA DE SESIÓN — Registro Obligatorio

Antes de ejecutar cualquier otra instrucción o instalar dependencias, debes generar tu firma de sesión según tu terminal y copiar el resultado obtenido en la primera página de tu reporte:

### PowerShell (Windows)

```powershell
Write-Output "SESION: $(Get-Date -Format 'yyyyMMdd_HHmmss') | NODE: $(node --version) | PNPM: $(pnpm --version) | USUARIO: $env:USERDOMAIN\$env:USERNAME"
```

### Bash (Linux / WSL / macOS / Git Bash)

```bash
echo "SESION: $(date '+%Y%m%d_%H%M%S') | NODE: $(node --version) | PNPM: $(pnpm --version) | USUARIO: $(whoami)"
```

---

## REQUISITOS — Verificación del Entorno Base

Comprueba que cuentas con el entorno global listo:

```powershell
# Verificar versiones instaladas
node --version
pnpm --version
```

---

## PARTE 1 — Inicialización del Proyecto Frontend

Inicializamos un proyecto frontend optimizado usando `Vite` y la plantilla vanilla con `pnpm`:

```powershell
# 1. Crear el proyecto frontend limpio
pnpm create vite dapp-frontend --template vanilla

# 2. Entrar a la carpeta del proyecto
cd dapp-frontend

# 3. Instalar las dependencias iniciales del andamiaje
pnpm install

# 4. Instalar de manera local ethers.js v6
pnpm add ethers

# 5. Verificar que la versión instalada sea la v6
pnpm list ethers

# 6. Levantar el servidor local de desarrollo para verificar que funcione
pnpm run dev
```

## PARTE 2 — Detección y Conexión con MetaMask

Para esta parte se debe configurar la interfaz de usuario y la lógica de conexión con MetaMask:

### Paso 2.1 — Reemplazar el HTML Base

Reemplaza el contenido de `index.html` en la raíz del proyecto `dapp-frontend/` con la estructura HTML de la dApp provista en las instrucciones (sección 2.1). Esta contiene los elementos de conexión (`#btnConectar`), saldos del contrato (`#saldoUsuario`), y los inputs de depósito y retiro.

### Paso 2.2 — Implementar la Lógica en `main.js`

Crea o reemplaza el archivo `main.js` en la raíz del proyecto `dapp-frontend/` con el código provista en las instrucciones (sección 2.2).

### Paso 2.3 — Levantar y Probar la dApp

Una vez modificados los archivos, inicia el servidor de desarrollo local y abre la dApp en el navegador:

```powershell
# Levantar el servidor de desarrollo si no está corriendo
pnpm run dev
```

1. Abre `http://localhost:5173` en el navegador.
2. Abre la consola de desarrollo (F12).
3. Haz clic en **"Conectar MetaMask"**.
4. Autoriza la conexión de tu cuenta en la ventana emergente de MetaMask.
5. Toma la captura obligatoria para la **Fig. 4**.

---

## PARTE 3 — Lectura del Estado del Contrato

### Paso 3.1 — Implementar la Lectura de Saldos en `main.js`

Reemplaza la función vacía `actualizarSaldos` en `main.js` con el código provisto en las instrucciones (sección 3.1). Esta función:

1. Obtiene la dirección del Signer actual con `signer.getAddress()`.
2. Llama a las funciones del contrato `contrato.consultarSaldo(direccion)` y `contrato.balanceContrato()`.
3. Convierte las cantidades devueltas en Wei a formato ETH legible usando `formatEther`.
4. Asocia la función al botón `#btnActualizar`.

*Tip para el Reporte:* Abre F12, ve a la pestaña **Network** (Red) y haz clic en "Actualizar saldos". Responde si hay peticiones HTTP salientes y por qué (el proveedor Web3 maneja las llamadas `eth_call` de solo lectura localmente).

---

## PARTE 4 — Envía Transacciones Firmadas

### Paso 4.1 — Implementar el Depósito de ETH

Agrega la función `depositar` y su listener de eventos al final de `main.js` (sección 4.1).

* Esta función toma el valor del input `#montoDeposito`.
* Envía la transacción firmada con `contrato.depositar({ value: parseEther(monto) })` (MetaMask pedirá confirmación).
* Espera a que la transacción sea minada usando `await tx.wait()`.
* Toma la captura obligatoria de la transacción confirmada.

### Paso 4.2 — Implementar el Retiro de ETH

Agrega la función `retirar` y su listener de eventos al final de `main.js` (sección 4.2).

* Esta función toma el valor del input `#montoRetiro`.
* Envía la transacción firmada invocando `contrato.retirar(parseEther(monto))`.
* Espera la confirmación con `await tx.wait()` y actualiza los saldos.

*Tip para el Reporte:* Registra los hashes, bloques y gas usado de ambas transacciones (depósito y retiro). Compara el consumo de gas de ambos y analízalo según el comportamiento del contrato (modificador `nonReentrant` y llamada externa en el retiro).

---

## PARTE 5 — Manejo de Eventos del Proveedor

### Paso 5.1 — Implementar Listeners del Proveedor EIP-1193

Agrega los escuchadores de eventos al final de `main.js` (sección 5.1):

* `accountsChanged`: Captura el cambio de cuenta activa del usuario y vuelve a invocar `conectar()`.
* `chainChanged`: Captura el cambio de red activa y recarga la dApp usando `window.location.reload()`.

### Paso 5.2 — Probar la Reactividad

1. Con la dApp abierta en el navegador, cambia a otra cuenta en MetaMask y observa los logs en pantalla.
2. Cambia la red de MetaMask (ej. de Sepolia a Ethereum Mainnet) y verifica que la página se recargue automáticamente.

---

## PARTE 6 — Suscripción a Eventos del Contrato

### Paso 6.1 — Suscribirse a Eventos de `BóvedaSegura`

Dentro de la función `conectar()` en `main.js`, justo después de inicializar el objeto `contrato`, suscríbete a los eventos que emite el contrato inteligente en la blockchain (sección 6.1):

* `contrato.on("Deposito", (cuenta, monto) => { ... })`
* `contrato.on("Retiro", (cuenta, monto) => { ... })`

### Paso 6.2 — Probar la Captura Asíncrona

1. Haz un depósito o retiro nuevo desde la dApp.
2. Compara el momento en que se muestra el mensaje `EVENTO Deposito` en los logs del sitio frente a la confirmación de bloque.
3. Toma la captura obligatoria del evento en el log.
