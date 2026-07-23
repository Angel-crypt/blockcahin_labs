# REQUISITOS — Verificación del Entorno

Comandos utilizados para comprobar que el entorno de desarrollo cumple con los requisitos del laboratorio (Node.js 18+):

```bash
# 1. Verificar la versión instalada de Node.js
node --version

# 2. Verificar la versión instalada de pnpm
pnpm --version
```

---

# PARTE 1 — Configuración del Entorno y Preparación

Secuencia de comandos ejecutada para inicializar el proyecto usando `pnpm` sin conflictos de dependencias:

```bash
# 1. Crear y entrar al directorio del laboratorio
mkdir dapp-lab
cd dapp-lab

# 2. Inicializar el package.json limpio con pnpm
pnpm init
```

* **Nota Intermedia (Edición de `package.json`):** Antes de instalar las dependencias, se debe abrir `package.json` y realizar las siguientes modificaciones para asegurar compatibilidad:
  1. Quitar el símbolo `^` de la versión de las dependencias si se requiere fijar versiones estrictas.
  2. **Eliminar la línea `"type": "module"`** (si existe) para que Node.js interprete los archivos `.js` como CommonJS (permitiendo el uso de `require`), lo cual es indispensable para la sintaxis de las pruebas unitarias y archivos de configuración de Hardhat 2.

```bash
# 3. Instalar Hardhat v2 y el Toolbox v5 compatible (como dependencias de desarrollo)
pnpm add -D hardhat@^2.22.12 @nomicfoundation/hardhat-toolbox@^5.0.0

# 4. Instalar dotenv para el manejo seguro de variables de entorno
pnpm add dotenv

# 5. Aprobar la compilación nativa de librerías de criptografía (keccak y secp256k1) en pnpm
pnpm approve-builds

# 6. Inicializar el andamiaje del proyecto en Hardhat (seleccionando hardhat-2 y mocha-ethers-js)
pnpm exec hardhat --init
```

---

# PARTE 2 — Desarrollo y Compilación del Contrato

Secuencia de comandos ejecutados en esta sección:

```bash
# 1. Eliminar el contrato por defecto Lock.sol
rm contracts/Lock.sol

# 2. Crear el archivo para BovedaSegura.sol
touch contracts/BovedaSegura.sol

# 3. Compilar los contratos del proyecto
pnpm exec hardhat compile
```

---

# PARTE 3 — Pruebas Automatizadas

Secuencia de comandos ejecutados en esta sección:

```bash
# 1. Eliminar la prueba de ejemplo por defecto Lock.js
rm test/Lock.js

# 2. Crear el archivo para BovedaSegura.test.js
touch test/BovedaSegura.test.js

# 3. Ejecutar las pruebas unitarias del proyecto
pnpm exec hardhat test

# 4. Ejecutar las pruebas unitarias con el reporte de gas habilitado en hardhat.config.cjs
pnpm exec hardhat test

# 5. Medir el porcentaje de cobertura de las pruebas unitarias
pnpm exec hardhat coverage
```

* **Nota sobre el Reporte de Gas:** En Hardhat v2 con Hardhat Toolbox, el parámetro `--reporter gas` no existe directamente en la CLI de Hardhat. En su lugar, el reporte se genera agregando la opción `gasReporter: { enabled: true }` en `hardhat.config.cjs` y ejecutando el comando de testeo normal (`pnpm exec hardhat test`).

---

# PARTE 4 — Configuración del Despliegue

Acciones de configuración y variables de entorno realizadas en esta sección:

```bash
# 1. Crear el archivo .env para variables de entorno sensibles
touch .env

# 2. Asegurar que .env no sea rastreado por Git (se agrega al .gitignore)
echo ".env" >> .gitignore
```

* **Nota sobre Configuración:** En esta sección se modificó manualmente `hardhat.config.cjs` para importar `dotenv` y definir la red `sepolia` utilizando las variables de entorno `process.env.ALCHEMY_SEPOLIA_URL` y `process.env.PRIVATE_KEY`.

---

# PARTE 5 — Despliegue en Sepolia

Secuencia de comandos ejecutados en esta sección:

```bash
# 1. Crear el script de verificación de saldo
touch scripts/verifica-saldo.js

# 2. Consultar el saldo del deployer en la red de pruebas Sepolia
pnpm exec hardhat run --network sepolia scripts/verifica-saldo.js

# 3. Crear el script de despliegue
touch scripts/deploy.js

# 4. Ejecutar el despliegue del contrato BovedaSegura en la red Sepolia
pnpm exec hardhat run scripts/deploy.js --network sepolia
```

---

# PARTE 6 — Interactúa con el Contrato Desplegado

Secuencia de comandos ejecutados en esta sección:

```bash
# 1. Crear el archivo de interacción
touch scripts/interactuar.js

# 2. Ejecutar las interacciones de depósito, retiro y consulta de saldo en Sepolia
pnpm exec hardhat run scripts/interactuar.js --network sepolia
```

---

# PARTE 7 — Demostración de Reentrancy Attack

Secuencia de comandos ejecutados en esta sección:

```bash
# 1. Crear el archivo para el contrato vulnerable BovedaVulnerable.sol
touch contracts/BovedaVulnerable.sol

# 2. Crear el archivo para el contrato atacante ContratoAtacante.sol
touch contracts/ContratoAtacante.sol

# 3. Crear el archivo de pruebas para reentrada Reentrancy.test.js
touch test/Reentrancy.test.js

# 4. Compilar los nuevos contratos añadidos
pnpm exec hardhat compile

# 5. Ejecutar las pruebas de reentrada locales
pnpm exec hardhat test test/Reentrancy.test.js
```

* **Nota sobre el Reportero:** Omitimos el parámetro `--reporter verbose` en el comando de testeo para evitar el error `HH305` de parámetros no reconocidos en la CLI de Hardhat. El formateador por defecto de Mocha (`spec`) es suficientemente descriptivo y detallará el éxito o fallo del ataque.
