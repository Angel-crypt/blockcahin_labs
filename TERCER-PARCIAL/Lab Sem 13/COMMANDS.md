# Historial de Comandos — Laboratorio 13 (Escalabilidad e Interoperabilidad)

Este archivo contiene el registro de ejecución de todos los comandos necesarios para completar el laboratorio, organizados por partes, detallando dónde capturar evidencias y con qué nombre guardarlas.

---

## Ancla de Sesión

Ejecutar este comando en la terminal para iniciar la sesión y registrar el entorno local. Copiar el resultado en la primera página del reporte.

```bash
# Registrar ancla de sesión en Windows PowerShell / pwsh
echo "SESION: $(Get-Date -Format "yyyyMMdd_HHmmss") | NODE: $(node --version) | HOST: $env:COMPUTERNAME | USUARIO: $env:USERNAME | PID: $PID" | Out-File -FilePath sesion.txt -Encoding utf8
Get-Content sesion.txt
```

---

## Parte 1 — El problema: por qué L1 no escala

1. Actualizar los valores de `scripts/costo-l1.js` con el precio de ETH actual (de CoinGecko o Etherscan) y el gas price actual en Gwei (de [Etherscan Gas Tracker](https://etherscan.io/gastracker)). El gas usado de la transacción del Lab 10 ya está preconfigurado en `46478` (depósito).
2. Ejecutar el script de simulación:

```bash
node scripts/costo-l1.js
```

---

## Parte 2 — Modela un Optimistic Rollup

1. Ejecutar el script de simulación de compresión y amortización:

```bash
node scripts/optimistic-rollup.js
```

---

## Parte 3 — Modela un ZK Rollup

1. Ejecutar el script de comparación de ciclos de vida y trade-offs:

```bash
node scripts/comparar-rollups.js
```

---

## Parte 4 — Datos reales: consulta L2Beat

1. Acceder a [L2Beat](https://l2beat.com) y completar la tabla de L2s requerida en el reporte con datos en tiempo real.
2. Buscar una transacción reciente en el explorador de la L2 elegida (ej. [Arbiscan](https://arbiscan.io/) o [Basescan](https://basescan.org/)).

---

## Parte 5 — Bridges: el eslabón más débil

1. Ejecutar la simulación del bridge lock-and-mint y el exploit de mensaje cross-chain forjado:

```bash
node scripts/bridge-lock-mint.js
```
