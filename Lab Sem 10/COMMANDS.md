```javascript
const boveda = await ethers.getContractAt("BovedaSegura", "TU_DIRECCION_DE_CONTRATO_AQUI");
```


# GUÍA DE COMANDOS COMPLETA — Laboratorio 10: Modelos de Amenazas en Blockchain

Este archivo contiene la secuencia ordenada de comandos, instrucciones de acceso y recursos web necesarios para completar paso a paso cada sección del laboratorio, garantizando que el entorno sea funcional y autocontenido.

---

## ANCLA DE SESIÓN — Registro Obligatorio

Antes de comenzar el laboratorio, ejecuta el comando que corresponda a tu terminal para generar tu firma de sesión y cópiala en la primera página del reporte.

### PowerShell (Windows)

```powershell
$commit = git rev-parse --short HEAD 2>$null; if (-not $commit) { $commit = "sin-repo" }
Write-Output "SESION: $(Get-Date -Format 'yyyyMMdd_HHmmss') | HOST: $($env:COMPUTERNAME) | USUARIO: $env:USERDOMAIN\$env:USERNAME | COMMIT: $commit"
```

### Bash (Linux / WSL / macOS / Git Bash)

```bash
echo "SESION: $(date '+%Y%m%d_%H%M%S') | HOST: $(hostname) | USUARIO: $(whoami) | COMMIT: $(git rev-parse --short HEAD 2>/dev/null || echo 'sin-repo')"
```

---

## PARTE 1 — Construcción del DFD y Elementos del Sistema

### 1.1. Obtener la Configuración y Dirección del Nodo RPC

Para completar los datos de tu nodo RPC (Alchemy URL) y llaves, podés ver el archivo de entorno en la raíz:

#### PowerShell

```powershell
Get-Content .env
```

#### Bash

```bash
cat .env
```

### 1.2. Levantar el Frontend para Identificar Dónde Corre

Para verificar en qué dirección y puerto corre tu frontend (por ejemplo, `http://localhost:5173`):

#### PowerShell & Bash

```bash
# 1. Acceder al directorio del frontend
cd dapp-frontend

# 2. Instalar dependencias locales del frontend (ignorando workspaces)
pnpm install --ignore-workspace

# 3. Levantar el servidor de desarrollo local
pnpm run dev
```

### 1.3. Consulta de Saldo de Contrato (Sepolia)

Para consultar el balance de ETH real custodiado por tu contrato, ejecutá este comando en la raíz del proyecto (`Lab Sem 10`):

#### PowerShell & Bash

```bash
pnpm hardhat run scripts/verifica-saldo.cjs --network sepolia
```

*(Alternativa: Verificar en el explorador ingresando a https://sepolia.etherscan.io/address/TU_DIRECCION_DE_CONTRATO)*

---

## PARTE 2 — Aplicación de STRIDE sobre las Fronteras

### 2.1. Inspección del Código del Contrato Inteligente

Para auditar la mitigación de amenazas y revisar la lógica de reentradas directamente en el código de tu contrato `BovedaSegura.sol`:

#### PowerShell

```powershell
Get-Content contracts/BovedaSegura.sol
```

#### Bash

```bash
cat contracts/BovedaSegura.sol
```

---

## PARTE 3 — Mapeo contra OWASP Smart Contract Top 10 (Edición 2026)

### 3.1. Acceso a Recursos de OWASP

Para realizar el mapeo de categorías de vulnerabilidades (SC01 a SC10) y sus mitigaciones:

* **Lista oficial OWASP Top 10 (2026):** `https://scs.owasp.org/sctop10/`

### 3.2. Consulta de Debilidades Específicas en SCWE

Para vincular tu categoría de mayor riesgo con al menos dos debilidades del catálogo SCWE e investigar la diferencia de propósito:

* **OWASP SCWE (Smart Contract Weakness Enumeration):** `https://scs.owasp.org/SCWE/`

---

## PARTE 4 — Vectores de Ataque Externos: el Alternate Top 15

### 4.1. Acceso al Catálogo de Vectores Web3

Para consultar las descripciones de los 15 vectores de ataque externos:

* **OWASP Alternate Top 15 — Web3 Attack Vectors:** `https://scs.owasp.org/sctop10/Web3-Attack-Vectors-Top15/`

### 4.2. Auditoría del Entorno de Desarrollo Real

#### Verificación de Exposición de Llaves Privadas (`.env`) en Git

Ejecutar desde la raíz del repositorio de Git:

##### PowerShell

```powershell
# Buscar si el archivo .env ha sido registrado en el historial de Git
$envHistory = git log --all --full-history -- .env 2>$null
if ($envHistory) { Write-Output "ALERTA: .env aparece en el historial de git" } else { Write-Output "OK: .env no está en el historial" }

# Verificar si .env está correctamente ignorado en el .gitignore
$ignored = git check-ignore -v .env 2>$null
if (-not $ignored) { Write-Output "ALERTA: .env NO está en .gitignore" } else { Write-Output "OK: .env está ignorado" }
```

##### Bash

```bash
# Buscar si el archivo .env ha sido registrado en el historial de Git
git log --all --full-history -- .env 2>/dev/null && echo "ALERTA: .env aparece en el historial de git" || echo "OK: .env no está en el historial"

# Verificar si .env está correctamente ignorado en el .gitignore
git check-ignore -v .env 2>/dev/null || echo "ALERTA: .env NO está en .gitignore"
```

#### Auditoría de Dependencias y Seguridad de pnpm

Ejecutar desde la raíz de `Lab Sem 10` para verificar la seguridad de la cadena de suministro de paquetes:

##### PowerShell & Bash

```bash
# Analizar vulnerabilidades conocidas en las dependencias
pnpm audit
```

#### Conteo del Total de Dependencias Instaladas (Primer Nivel)

Ejecutar desde la raíz de `Lab Sem 10`:

##### PowerShell

```powershell
# Obtener el conteo de dependencias principales y de desarrollo
$json = pnpm list --depth 0 --json 2>$null | ConvertFrom-Json
$totalDeps = ($json.dependencies.PSObject.Properties).Count + ($json.devDependencies.PSObject.Properties).Count
Write-Output "Total de dependencias directas: $totalDeps"
```

##### Bash

```bash
# Obtener el conteo de dependencias principales y de desarrollo
pnpm list --depth 0 --json 2>/dev/null | jq '.[0] | (.dependencies // {} | keys | length) + (.devDependencies // {} | keys | length)'
```

### 4.3. Consulta del Eslabón Administrativo del Contrato

Para identificar al creador y propietario del contrato desde la consola de Hardhat:

#### PowerShell & Bash

```bash
# 1. Abrir la consola interactiva de Hardhat conectada a Sepolia
pnpm hardhat console --network sepolia
```

#### Código JavaScript a ejecutar dentro de la Consola de Hardhat:

```javascript
// Obtener la instancia del contrato desplegado
const boveda = await ethers.getContractAt("BovedaSegura", "TU_DIRECCION_DE_CONTRATO_AQUI");

// Consultar el owner del contrato (si implementa Ownable)
const owner = await boveda.owner();
console.log("Dirección del Owner:", owner);
```

---

## PARTE 5 — Matriz de Riesgos Anclada a Datos Reales

### 5.1. Consulta de Datos Empíricos y Metodología

Para consultar las estadísticas de incidentes de smart contracts, montos perdidos en dólares y metodología de análisis de OWASP:

* **Fuentes de Datos Oficiales:** `https://scs.owasp.org/sctop10/data-sources/`
* **Metodología Oficial de Mapeo:** `https://scs.owasp.org/sctop10/methodology/`

---

## PARTE 6 — Reflexión Final

### 6.1. Preguntas de Cierre

Para responder a la sección final, utilizá la información reunida en las partes anteriores:

1. El porcentaje que representa el balance de tu contrato en Sepolia frente a las pérdidas globales de OWASP.
2. La racionalidad del presupuesto de auditorías en contratos vs seguridad off-chain.
3. Las limitaciones de Slither y Aderyn ante fallas de lógica administrativa y operacional off-chain.
