# GUÍA DE COMANDOS COMPLETA — Laboratorio 11: Identidad Descentralizada (DID)

Este archivo contiene la secuencia ordenada de comandos, instrucciones de ejecución de scripts y recursos para completar paso a paso cada sección del laboratorio, garantizando que el entorno sea funcional y autocontenido.

---

## ANCLA DE SESIÓN — Registro Obligatorio

Antes de comenzar el laboratorio, ejecuta el comando que corresponda a tu terminal para generar tu firma de sesión y cópiala en la primera página del reporte.

### PowerShell (Windows)

```powershell
$commit = git rev-parse --short HEAD 2>$null; if (-not $commit) { $commit = "sin-repo" }
Write-Output "SESION: $(Get-Date -Format 'yyyyMMdd_HHmmss') | NODE: $(node --version) | HOST: $($env:COMPUTERNAME) | USUARIO: $env:USERDOMAIN\$env:USERNAME | COMMIT: $commit"
```

### Bash (Linux / WSL / macOS / Git Bash)

```bash
echo "SESION: $(date '+%Y%m%d_%H%M%S') | NODE: $(node --version) | HOST: $(hostname) | USUARIO: $(whoami) | COMMIT: $(git rev-parse --short HEAD 2>/dev/null || echo 'sin-repo')"
```

---

## PARTE 1 — Prepara el entorno y estudia el modelo

### 1.1. Inicialización e instalación de dependencias

#### PowerShell & Bash

```bash
# Inicializar proyecto
npm init -y

# Configurar tipo módulo
npm pkg set type=module

# Instalar dependencias
npm install did-jwt ethr-did did-resolver ethr-did-resolver ethers@6

# Ejecutar auditoría de seguridad
npm audit
```

---

## PARTE 2 — Genera tu DID

### 2.1. Crear y ejecutar el generador de identidad

#### PowerShell & Bash

```bash
# Ejecutar script
node scripts/01-generar-did.js
```

---

## PARTE 3 — Resuelve el DID Document

### 3.1. Resolver el documento DID generado

#### PowerShell & Bash

```bash
# Ejecutar resolución local
node scripts/02-resolver-did.js
```

---

## PARTE 4 — Emite una credencial verificable

### 4.1. Emitir la credencial en formato JWT

#### PowerShell & Bash

```bash
# Ejecutar emisión de credencial
node scripts/03-emitir-credencial.js
```

---

## PARTE 5 — Verifica y detecta manipulación

### 5.1. Verificar credencial original y alterada

#### PowerShell & Bash

```bash
# Ejecutar verificación y simulación de ataque
node scripts/04-verificar.js
```

---

## PARTE 6 — Divulgación selectiva: el eje de privacidad

### 6.1. Ejecutar divulgación selectiva con SD-JWT

#### PowerShell & Bash

```bash
# Ejecutar divulgación selectiva
node scripts/05-divulgacion-selectiva.js
```

---

## PARTE 7 — Análisis de correlación

### 7.1. Analizar correlación de DIDs

#### PowerShell & Bash

```bash
# Ejecutar script de correlación
node scripts/06-correlacion.js
```
