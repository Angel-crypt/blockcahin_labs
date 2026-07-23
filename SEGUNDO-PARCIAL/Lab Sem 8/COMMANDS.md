# GUÍA DE COMANDOS — Laboratorio 8: Auditoría y Seguridad de Contratos Inteligentes

Este archivo contiene la secuencia ordenada de comandos necesarios para configurar el entorno de desarrollo, instalar los analizadores estáticos de seguridad en un entorno virtual aislado con `uv`, y ejecutar las pruebas de concepto y remediación utilizando `Hardhat` con `pnpm`.

---

## REQUISITOS — Verificación del Entorno Base

Antes de comenzar, comprueba que tienes las herramientas base instaladas globalmente en tu sistema (Node.js 18+, Python 3.10+ y `uv`):

```powershell
# 1. Verificar Node.js y el gestor de paquetes de Node
node --version
pnpm --version

# 2. Verificar la versión de Python global
python --version

# 3. Verificar que tienes uv instalado (instalador ultra veloz de Python escrito en Rust)
uv --version
```

*Nota: Si no tienes `uv` instalado, puedes instalarlo rápidamente en Windows con:*
`powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"` o usando `pip install uv` de manera global.

---

## PARTE 1 — Aislamiento del Entorno con `uv` e Instalación de Herramientas

Para evitar colisiones de dependencias de Python a nivel global, configuramos un entorno virtual (`venv`) localizado dentro de la carpeta del laboratorio utilizando `uv`.

### 1. Inicialización y Activación del Entorno Virtual de Python

```powershell
# Crear el entorno virtual en la carpeta local (.venv)
uv venv

# Activar el entorno virtual en PowerShell (Windows)
.venv\Scripts\Activate.ps1

# (Alternativa si usas CMD clásica de Windows)
# .venv\Scripts\activate.bat
```

### 2. Instalación de Slither (Trail of Bits) usando `uv`

Una vez activado el entorno virtual (verás el prefijo `(.venv)` en tu terminal):

```powershell
# Instalar slither-analyzer directamente en el entorno aislado
uv pip install slither-analyzer

# Verificar la instalación local
slither --version
```

*Tip de arquitectura (Ejecución sin activar):* Si prefieres no activar el entorno, `uv` te permite ejecutar comandos directamente con:
`uv run slither --version`

### 3. Instalación de Aderyn (Cyfrin en WSL Ubuntu)

Dado que la ejecución nativa en Windows de Aderyn presenta problemas con el análisis de rutas y fallas en los detectores base, se utiliza **WSL (Windows Subsystem for Linux)** con la distribución de Ubuntu. Esto nos permite ejecutar de manera estable la versión oficial más reciente de **Aderyn (v0.6.8)**.

```powershell
# 1. Habilitar e instalar WSL con Ubuntu desde PowerShell (como administrador si no lo tienes instalado)
wsl --install -d Ubuntu

# 2. Una vez dentro de la terminal de tu WSL (Ubuntu), ejecuta el instalador oficial de Cyfrin
curl --proto '=https' --tlsv1.2 -LsSf https://github.com/cyfrin/aderyn/releases/latest/download/aderyn-installer.sh | bash

# 3. Recargar la configuración para registrar Aderyn en la terminal de WSL
source ~/.bashrc

# 4. Verificar la instalación y versión correcta en WSL
aderyn --version
```

---

## PARTE 2 — Configuración de Hardhat y Estructura de Contratos

Dado que no se reutilizará el proyecto del Laboratorio 7, inicializaremos un nuevo proyecto Hardhat desde cero utilizando `pnpm` directamente en el directorio raíz de este laboratorio.

### 1. Inicialización del Proyecto y Dependencias

```powershell
# 1. Inicializar package.json limpio
pnpm init

# 2. Instalar Hardhat y la suite de herramientas oficiales (Toolbox)
pnpm add -D hardhat@^2.22.12 @nomicfoundation/hardhat-toolbox@^5.0.0

# 3. Instalar dotenv para el manejo seguro de variables de entorno
pnpm add dotenv

# 4. Inicializar el andamiaje del proyecto Hardhat
pnpm exec hardhat init
```

> [!TIP]
> **Opciones del Asistente de Hardhat:**
> Al ejecutar `pnpm exec hardhat init`, selecciona las siguientes opciones en la consola interactiva:
>
> 1. Elige **"Create a JavaScript project"** (usar las flechas y presionar Enter).
> 2. En la ruta del proyecto, presiona Enter para usar el directorio actual (`.`).
> 3. En la opción de agregar `.gitignore`, presiona **y** (sí).

### 2. Creación de Contratos Vulnerables

Una vez creado el andamiaje de Hardhat:

```powershell
# 1. Eliminar el contrato de ejemplo autogenerado (Lock.sol)
Remove-Item -Path "contracts/Lock.sol" -ErrorAction SilentlyContinue -Force

# 2. Crear los archivos para los contratos vulnerables del laboratorio
touch contracts/BovedaVulnerable.sol
touch contracts/TokenVulnerable.sol

# 3. Compilar los contratos para verificar que no hay errores y generar los artefactos
pnpm exec hardhat compile
```

---

## PARTE 3 — Análisis con Slither

Ejecución de Slither sobre el código compilado para mapear los vectores de ataque.

```powershell
# 1. Ejecutar análisis completo excluyendo las librerías del compilador
slither . --exclude-dependencies

# (Alternativa directa con uv run, sin activar el entorno virtual)
# uv run slither . --exclude-dependencies

# 2. Generar el reporte markdown interactivo (checklist)
slither . --exclude-dependencies --checklist > EVIDENCIAS/PARTE3/reporte-slither.md

# 3. Ejecutar únicamente los detectores críticos (alto impacto)
slither . --exclude-dependencies --detect reentrancy-eth,reentrancy-no-eth,divide-before-multiply,suicidal
```

---

## PARTE 4 — Análisis con Aderyn

Ejecución de Aderyn sobre el proyecto para auditar vulnerabilidades.

```bash
# 1. Ejecutar Aderyn en la terminal de WSL excluyendo node_modules para evitar compilar dependencias de terceros
aderyn . --path-excludes node_modules

# 2. Mover el reporte generado a la carpeta de evidencias correspondiente con su nomenclatura correcta
mv report.md EVIDENCIAS/PARTE4/reporte-aderyn.md
```

---

## PARTE 5 — Demostración del Ataque de Reentrancy (SWC-107)

Escribir y ejecutar el exploit local en Hardhat para demostrar el drenado de fondos de la bóveda vulnerable.

```powershell
# 1. Crear el contrato explotador y el archivo de pruebas
touch contracts/AtacanteReentrancy.sol
touch test/Reentrancy.test.js

# 2. Compilar el nuevo contrato atacante
pnpm exec hardhat compile

# 3. Ejecutar el exploit localmente y observar el drenado de fondos y llamadas a receive()
pnpm exec hardhat test test/Reentrancy.test.js
```

---

## PARTE 6 — Demostración de Integer Overflow (SWC-101)

Escribir y ejecutar las pruebas de desbordamiento en bloques `unchecked` para verificar la vulnerabilidad de overflow/underflow.

```powershell
# 1. Crear la suite de pruebas de desbordamiento
touch test/IntegerOverflow.test.js

# 2. Ejecutar las pruebas unitarias y verificar el comportamiento del storage de uint256
pnpm exec hardhat test test/IntegerOverflow.test.js
```

---

## PARTE 7 — Remediación con OpenZeppelin

Instalación de contratos estandarizados de OpenZeppelin, creación de contratos seguros y validación con pruebas.

### 1. Instalación y Creación de Contratos Seguros

```powershell
# 1. Instalar los contratos base de OpenZeppelin en el proyecto
pnpm add @openzeppelin/contracts

# 2. Crear los archivos de contratos remediados
touch contracts/BovedaSegura.sol
touch contracts/TokenSeguro.sol

# 3. Compilar para verificar la sintaxis de los nuevos contratos remediados
pnpm exec hardhat compile
```

### 2. Validación de la Resistencia a Ataques

```powershell
# 1. Crear la suite de test que valida la remediación
touch test/Remediacion.test.js

# 2. Correr las pruebas (ambos exploits deben fallar/revertir contra los contratos seguros)
pnpm exec hardhat test test/Remediacion.test.js
```

---

## PARTE 8 — Re-auditoría: verificación de parches

Re-ejecución de los analizadores estáticos para comprobar la mitigación total de los hallazgos críticos.

```powershell
# 1. Ejecutar Slither específicamente sobre los archivos corregidos
slither contracts/BovedaSegura.sol --exclude-dependencies --solc-remaps "@openzeppelin/contracts/=node_modules/@openzeppelin/contracts/"
slither contracts/TokenSeguro.sol --exclude-dependencies

# (Alternativa directa con uv run)
# uv run slither contracts/BovedaSegura.sol --exclude-dependencies

# 2. Ejecutar Aderyn para verificar la eliminación de alertas HIGH generales (en la terminal de WSL)
aderyn . --path-excludes node_modules

# 3. Mover el reporte de re-auditoría generado a la carpeta de evidencias correspondiente
mv report.md EVIDENCIAS/PARTE8/reporte-aderyn.md
```
