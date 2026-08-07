# Laboratorio — Escalabilidad e Interoperabilidad
**Materia:** Blockchain y Bases de Datos Distribuidas | **Carrera:** Ciberseguridad y Desarrollo de Software
**Tema:** Soluciones de capa 2 (Rollups) y puentes (Bridges)

---

## Propósito

Al terminar este laboratorio serás capaz de:

- Cuantificar el problema de escalabilidad de Ethereum L1 y por qué las L2 existen
- Modelar el mecanismo de un optimistic rollup y de un ZK rollup, y comparar sus trade-offs
- Contrastar L2 reales con datos actuales verificables, no memorizados
- Analizar por qué los bridges son el componente más atacado de todo el ecosistema

**Caso guía:** Tu empresa procesa micropagos de $2 USD. En Ethereum L1 cada transacción cuesta más que el pago mismo. Debes elegir una solución de escalabilidad y, si el negocio opera en varias cadenas, un mecanismo de interoperabilidad. La decisión mueve fondos reales: elegir mal un bridge ha costado cientos de millones a otras empresas. Tu recomendación debe sostenerse con datos actuales y análisis de riesgo, no con la reputación de una marca.

---

## Requisitos

- Node.js 18+
- Navegador con acceso a exploradores y agregadores de datos L2
- El contrato en Sepolia y las mediciones de gas de laboratorios anteriores

**Nota de vigencia — este es un tema que cambia rápido:**

Los datos de TVL, fees y TPS de este laboratorio cambian cada semana. El laboratorio te exige consultar **fuentes en vivo** (L2Beat, exploradores) en el momento de ejecutarlo, no confiar en cifras escritas aquí. Cualquier número que aparezca en estas instrucciones es de referencia y debe verificarse. Fuentes primarias:

- L2Beat (TVL y etapa de descentralización): `https://l2beat.com`
- L2Beat Bridges: `https://l2beat.com/bridges`
- Exploradores: Arbiscan, Basescan, Etherscan

---

## Ancla de sesión

```bash
mkdir -p ~/lab-l2 && cd ~/lab-l2
echo "SESION: $(date '+%Y%m%d_%H%M%S') | NODE: $(node --version) | HOST: $(hostname) | USUARIO: $(whoami) | PID: $$" | tee sesion.txt
```

Copia la línea en la primera página de tu reporte. Entregas sin este valor son inválidas. Registra además la **fecha exacta** en que consultaste los datos en vivo — es tu marca de vigencia.

---

## Parte 1 — El problema: por qué L1 no escala

**Paso 1.1 — Cuantifica el costo real en L1**

Recupera de tu laboratorio de dApps el gas que consumió una transacción de tu contrato (depósito o retiro). Si no lo tienes, consulta cualquier transacción reciente en `https://etherscan.io` y anota su `Gas Used`.

Consulta el gas price actual de Ethereum en `https://etherscan.io/gastracker`. Anota el valor en Gwei.

Crea `costo-l1.js`:

```javascript
// Calcula el costo real de una transacción según parámetros actuales
// REEMPLAZA con los valores que consultaste

const GAS_USADO = 50000;        // gas de tu transacción
const GAS_PRICE_GWEI = 10;      // del gas tracker de Etherscan
const PRECIO_ETH_USD = 3000;    // consúltalo en vivo

const costoEth = (GAS_USADO * GAS_PRICE_GWEI) / 1e9;
const costoUsd = costoEth * PRECIO_ETH_USD;

console.log('=== COSTO EN ETHEREUM L1 ===');
console.log(`Gas usado:        ${GAS_USADO}`);
console.log(`Gas price:        ${GAS_PRICE_GWEI} Gwei`);
console.log(`Costo en ETH:     ${costoEth.toFixed(6)} ETH`);
console.log(`Costo en USD:     $${costoUsd.toFixed(2)}`);

console.log('\n=== VIABILIDAD PARA MICROPAGOS DE $2 ===');
const pagoMicro = 2.00;
console.log(`Pago del cliente:      $${pagoMicro.toFixed(2)}`);
console.log(`Comisión de red:       $${costoUsd.toFixed(2)}`);
console.log(`Comisión como % pago:  ${(costoUsd/pagoMicro*100).toFixed(1)}%`);
console.log(`¿Viable?               ${costoUsd < pagoMicro * 0.05 ? 'SÍ' : 'NO'}`);
```

Ejecuta con tus valores reales:

```bash
node costo-l1.js
```

Anota el costo en USD y el porcentaje que representa sobre un pago de $2.

**Paso 1.2 — El límite de throughput**

Consulta en `https://etherscan.io` el gas limit por bloque y el tiempo promedio entre bloques (block time). Anota ambos.

Con una transacción simple consumiendo ~21,000 gas, calcula:
- ¿Cuántas transacciones caben en un bloque?
- Con el block time actual, ¿cuántas transacciones por segundo (TPS) procesa Ethereum L1 como máximo?

Compara tu resultado con los ~89 TPS que Base (una L2) sostenía en 2026. ¿Cuántas veces más throughput tiene la L2?

**Afirmación para refutar o confirmar:** *"Ethereum L1 no escala porque su tecnología es obsoleta; una blockchain moderna simplemente aumentaría el tamaño de bloque para procesar más transacciones."*

Investiga el "trilema de escalabilidad" (Vitalik Buterin) y responde: ¿por qué aumentar el tamaño de bloque no es una solución aceptable? ¿Qué propiedad se sacrificaría? Refuta o confirma la afirmación.

> Evidencia obligatoria: salida de `costo-l1.js` con tus valores reales y el cálculo de TPS de L1.

---

## Parte 2 — Modela un Optimistic Rollup

Un rollup ejecuta transacciones fuera de L1, las agrupa en lotes (batches), las comprime y publica los datos en L1. El "optimistic" asume que todas son válidas salvo prueba en contra.

**Paso 2.1 — Simula el batching y la compresión**

Crea `optimistic-rollup.js`:

```javascript
// Modela cómo un optimistic rollup agrupa y comprime transacciones

// Una transacción individual en L1 ocupa ~112 bytes de calldata
const BYTES_TX_L1 = 112;
// Comprimida en un rollup, ~12 bytes (firmas agregadas, nonces omitidos, etc.)
const BYTES_TX_ROLLUP = 12;

function simularBatch(numTransacciones) {
  const costoL1Individual = numTransacciones * BYTES_TX_L1;
  const costoRollupBatch = numTransacciones * BYTES_TX_ROLLUP;
  const ahorro = (1 - costoRollupBatch / costoL1Individual) * 100;

  return {
    transacciones: numTransacciones,
    bytesL1: costoL1Individual,
    bytesRollup: costoRollupBatch,
    ahorroPct: ahorro.toFixed(1),
    factorCompresion: (costoL1Individual / costoRollupBatch).toFixed(1)
  };
}

console.log('=== COMPRESIÓN POR BATCHING ===\n');
console.log('Costo de publicar N transacciones como datos en L1:\n');
console.log(`${'N tx':>8} ${'Bytes L1':>12} ${'Bytes Rollup':>14} ${'Ahorro':>10} ${'Factor':>8}`);

for (const n of [1, 10, 100, 1000]) {
  const r = simularBatch(n);
  console.log(`${r.transacciones:>8} ${r.bytesL1:>12} ${r.bytesRollup:>14} ${r.ahorroPct+'%':>10} ${r.factorCompresion+'x':>8}`);
}

console.log('\n=== EL COSTO SE AMORTIZA ENTRE TODOS ===\n');
// El costo fijo de publicar el batch en L1 se divide entre todas las tx
const COSTO_BATCH_L1_USD = 5.00; // costo de publicar el batch en L1
for (const n of [1, 10, 100, 1000]) {
  const costoPorTx = COSTO_BATCH_L1_USD / n;
  console.log(`Batch de ${n:>4} tx → costo L1 por tx: $${costoPorTx.toFixed(4)}`);
}
```

```bash
node optimistic-rollup.js
```

Anota la tabla de compresión y la de amortización.

Responde:
- ¿Qué factor de compresión se logra? ¿Por qué agrupar transacciones reduce tanto el costo por transacción individual?
- El costo de publicar el batch en L1 es fijo. ¿Por qué el costo por transacción baja cuanto más grande es el batch? Relaciónalo con tu resultado de micropagos de la Parte 1.
- Investiga qué son los "blobs" de EIP-4844 (upgrade Dencun, marzo 2024) y por qué redujeron las fees de los rollups en aproximadamente un orden de magnitud. ¿Qué problema del almacenamiento en calldata resolvieron?

**Paso 2.2 — El fraud proof y la ventana de desafío**

El optimistic rollup asume validez. Si alguien detecta fraude, lo prueba durante una ventana de tiempo.

Responde en tu reporte:
- Investiga cuánto dura la ventana de fraud proof (challenge window) en Arbitrum y Optimism. Anota el valor.
- Durante esa ventana, ¿puedes retirar tus fondos de la L2 a L1 inmediatamente? ¿Qué implica eso para un usuario que quiere mover fondos con urgencia?
- Un "fraud proof" requiere que al menos un actor honesto vigile y desafíe transacciones inválidas. ¿Qué supuesto de seguridad hace esto? ¿Qué pasaría si nadie vigilara?

> Evidencia obligatoria: salida de `optimistic-rollup.js` con ambas tablas.

---

## Parte 3 — Modela un ZK Rollup

Un ZK rollup no asume validez: la **prueba** matemáticamente con una validity proof adjunta a cada batch.

**Paso 3.1 — Compara los dos modelos**

Crea `comparar-rollups.js`:

```javascript
// Compara el ciclo de vida de una transacción en cada tipo de rollup

const rollups = {
  optimistic: {
    nombre: 'Optimistic Rollup (Arbitrum, Base, OP)',
    prueba: 'Ninguna adjunta — se asume válida',
    verificacionL1: 'Solo si alguien presenta un fraud proof',
    ventanaRetiro: '7 días (challenge window)',
    costoComputo: 'Bajo (no genera pruebas)',
    supuestoSeguridad: 'Al menos 1 verificador honesto vigilando'
  },
  zk: {
    nombre: 'ZK Rollup (zkSync, Starknet, Scroll, Linea)',
    prueba: 'Validity proof (SNARK/STARK) adjunta a cada batch',
    verificacionL1: 'L1 verifica la prueba matemáticamente en cada batch',
    ventanaRetiro: 'Menos de 1 hora (sin challenge window)',
    costoComputo: 'Alto (generar la prueba es costoso)',
    supuestoSeguridad: 'Validez criptográfica — no requiere vigilantes'
  }
};

for (const [tipo, r] of Object.entries(rollups)) {
  console.log(`\n=== ${r.nombre} ===`);
  console.log(`  Prueba de validez:    ${r.prueba}`);
  console.log(`  Verificación en L1:   ${r.verificacionL1}`);
  console.log(`  Tiempo de retiro:     ${r.ventanaRetiro}`);
  console.log(`  Costo de cómputo:     ${r.costoComputo}`);
  console.log(`  Supuesto de seguridad: ${r.supuestoSeguridad}`);
}

console.log('\n\n=== ESCENARIO: retiro urgente de $10,000 a L1 ===');
console.log('Optimistic: debes esperar 7 días O usar un servicio de');
console.log('            liquidez de terceros que cobra comisión.');
console.log('ZK:         disponible en menos de 1 hora, sin intermediario.');
```

```bash
node comparar-rollups.js
```

Anota la comparación.

Responde con base en lo que investigues:
- Un ZK rollup genera una prueba criptográfica costosa pero permite retiro rápido. Un optimistic no genera prueba pero exige esperar 7 días. ¿Por qué existe ese trade-off? ¿Qué se paga en cada caso?
- Investiga por qué, pese a la ventaja de finalidad de los ZK rollups, los optimistic dominaban ~80% del TVL en 2026. Pista: investiga qué es "EVM-equivalence" y por qué facilitó la migración de contratos existentes.
- Los ZK rollups tenían menor throughput (TPS) que los optimistic en 2026 pese a su ventaja teórica. Investiga qué es el "proof-generation overhead" y por qué limita el TPS.

**Afirmación para refutar o confirmar:** *"Los ZK rollups son criptográficamente superiores, por eso reemplazaron a los optimistic rollups y hoy dominan el mercado."*

Verifica en `https://l2beat.com` la distribución actual de TVL entre optimistic y ZK. Con el dato en vivo, refuta o confirma.

> Evidencia obligatoria: salida de `comparar-rollups.js` y captura de L2Beat mostrando la distribución de TVL actual.

---

## Parte 4 — Datos reales: consulta L2Beat

**Paso 4.1 — Compara L2 con datos en vivo**

Abre `https://l2beat.com`. **Los datos cambian constantemente — usa lo que veas hoy, no lo que creas saber.**

Completa esta tabla con los valores **del día en que ejecutas el laboratorio**:

| L2 | Tipo (Optimistic/ZK) | TVL / TVS actual | Stage (0/1/2) | Chain ID |
|---|---|---|---|---|
| Arbitrum One | | | | |
| Base | | | | |
| OP Mainnet | | | | |
| zkSync Era | | | | |
| Starknet | | | | |

**Paso 4.2 — El concepto de "Stage"**

L2Beat clasifica las L2 en Stage 0, 1 y 2 según su grado de descentralización. Consulta `https://l2beat.com` y responde:

- ¿Qué significa cada Stage? ¿Qué debe cumplir una L2 para pasar de Stage 0 a Stage 1 y a Stage 2?
- ¿Alguna de las L2 de tu tabla es Stage 2? La mayoría no lo es. ¿Qué "training wheels" (mecanismos de seguridad centralizados) conservan las L2 en Stage 0 y 1?
- Para el caso guía, ¿preferirías desplegar en una L2 Stage 1 con mucho TVL o en una Stage 2 con poco TVL? Argumenta el trade-off entre descentralización y liquidez.

**Paso 4.3 — Verifica una transacción real en una L2**

Elige una de las L2 de tu tabla y abre su explorador (Arbiscan para Arbitrum, Basescan para Base). Busca cualquier transacción reciente y anota:
- El gas fee en la moneda nativa y su equivalente en USD
- Compáralo con el costo en L1 que calculaste en la Parte 1

¿Cuántas veces más barata es la transacción en la L2 respecto a L1, con tus datos reales?

> Evidencia obligatoria: captura de L2Beat con tu tabla, y captura de una transacción real en el explorador de una L2 con su fee visible.

---

## Parte 5 — Bridges: el eslabón más débil

Las L2 resuelven escalabilidad dentro de un ecosistema. Mover activos **entre** cadenas distintas requiere un bridge, y ahí está el mayor riesgo del ecosistema.

**Paso 5.1 — Modela el mecanismo lock-and-mint**

El modelo más común de bridge bloquea el activo en la cadena origen y acuña una representación en la destino.

Crea `bridge-lock-mint.js`:

```javascript
// Modela un bridge lock-and-mint y su punto de vulnerabilidad

class Bridge {
  constructor() {
    this.bloqueadoEnOrigen = 0;    // activos reales bloqueados (cadena A)
    this.acunadoEnDestino = 0;     // tokens wrapped acuñados (cadena B)
    this.log = [];
  }

  // Usuario deposita en cadena origen → se acuña wrapped en destino
  bridge(monto, mensajeValido = true) {
    if (mensajeValido) {
      this.bloqueadoEnOrigen += monto;
      this.acunadoEnDestino += monto;
      this.log.push(`BRIDGE OK: +${monto} bloqueado, +${monto} acuñado`);
    } else {
      // ATAQUE: mensaje forjado — acuña SIN bloquear respaldo
      this.acunadoEnDestino += monto;
      this.log.push(`MENSAJE FORJADO: +${monto} acuñado SIN respaldo`);
    }
  }

  // La invariante que SIEMPRE debe cumplirse
  verificarSolvencia() {
    const solvente = this.bloqueadoEnOrigen >= this.acunadoEnDestino;
    return {
      bloqueado: this.bloqueadoEnOrigen,
      acunado: this.acunadoEnDestino,
      solvente,
      deficit: this.acunadoEnDestino - this.bloqueadoEnOrigen
    };
  }
}

console.log('=== OPERACIÓN NORMAL ===');
const bridge = new Bridge();
bridge.bridge(100);
bridge.bridge(50);
console.log(bridge.log.join('\n'));
console.log('Solvencia:', bridge.verificarSolvencia());

console.log('\n=== ATAQUE: MENSAJE CROSS-CHAIN FORJADO ===');
bridge.bridge(1000000, false);  // el atacante forja un mensaje
console.log(bridge.log[bridge.log.length - 1]);
const estado = bridge.verificarSolvencia();
console.log('Solvencia:', estado);
console.log(`\n¿El bridge quebró? ${!estado.solvente ? 'SÍ' : 'NO'}`);
console.log(`Déficit (tokens sin respaldo): ${estado.deficit}`);
console.log('Estos tokens acuñados sin respaldo pueden venderse,');
console.log('drenando la liquidez y colapsando el precio del wrapped token.');
```

```bash
node bridge-lock-mint.js
```

Anota el resultado del ataque.

Responde:
- ¿Cuál es la invariante que un bridge lock-and-mint debe mantener siempre? ¿Qué la rompió el ataque?
- El ataque acuñó tokens sin bloquear respaldo mediante un "mensaje forjado". ¿Qué componente del bridge debía validar ese mensaje y falló? Investiga qué son los "validadores" o "guardianes" de un bridge.
- ¿Por qué un bridge es estructuralmente más peligroso que un contrato normal? Pista: un contrato normal solo confía en su propia cadena; un bridge debe confiar en el estado de **otra** cadena.

**Paso 5.2 — Los datos de la realidad**

Investiga en fuentes actuales (L2Beat Bridges, PeckShield, o reportes de seguridad) y responde:
- ¿Qué porcentaje del valor total perdido en DeFi corresponde históricamente a bridges?
- Nombra al menos tres de los mayores hacks de bridges de la historia con su monto (por ejemplo Ronin, Wormhole, Nomad) y anota la fuente.
- En 2026, ¿los bridges seguían siendo un objetivo desproporcionado respecto a su participación en el TVL? Cita un dato con su fecha.

> Evidencia obligatoria: salida de `bridge-lock-mint.js` mostrando el ataque, y las cifras de pérdidas de bridges con sus fuentes.

---

## Parte 6 — Análisis de un exploit real

**Paso 6.1 — Estudia un caso documentado**

Elige uno de estos bridges hackeados e investígalo en fuentes técnicas: **Ronin (2022), Wormhole (2022) o Nomad (2022)**. Documenta en tu reporte:

- Monto robado y fecha
- Causa raíz técnica: ¿claves privadas comprometidas, validación de firma defectuosa, o mensaje forjado?
- ¿Cuántos validadores o firmas controlaba el atacante y cuántas se requerían?

**Paso 6.2 — Clasifica el vector**

Con lo que modelaste en la Parte 5 y el caso que investigaste, clasifica la causa raíz. Los bridges fallan típicamente por: (a) compromiso de claves de validadores, (b) validación de mensajes defectuosa, (c) errores en la lógica del contrato, (d) fallas de control de acceso.

¿En cuál categoría cae tu caso? Justifica con la causa raíz que documentaste.

**Paso 6.3 — Matriz de riesgo de bridges**

Completa esta matriz para tres tipos de bridge. Investiga cada modelo:

| Tipo de bridge | Modelo de confianza | Punto de fallo principal | Ejemplo |
|---|---|---|---|
| Multisig / federado | | | |
| Lock-and-mint con validadores externos | | | |
| Nativo de rollup (canonical bridge) | | | |

Responde: el "canonical bridge" de un rollup (el puente oficial entre la L2 y Ethereum) se considera más seguro que un bridge de terceros. ¿Por qué? Relaciónalo con de quién hereda la seguridad cada uno.

> Evidencia obligatoria: tu análisis del exploit elegido con la causa raíz y fuente, y la matriz de riesgo completa.

---

## Parte 7 — Decisión de arquitectura y reflexión

**Paso 7.1 — Resuelve el caso guía**

Con todo lo medido, produce tu recomendación para la empresa de micropagos de $2:

1. **¿L1 o L2?** Justifica con tu cálculo de costo de la Parte 1.
2. **¿Optimistic o ZK?** Considera: ¿los usuarios necesitan retirar rápido? ¿el volumen justifica el costo? Cita datos de tu tabla de la Parte 4.
3. **¿Necesita bridge?** Si el negocio opera solo en una L2, ¿necesita un bridge de terceros o le basta el canonical bridge? Justifica con tu matriz de riesgo.

**Paso 7.2 — Reflexión final**

Responde con base en lo que mediste e investigaste. Respuestas sin tus valores propios son inválidas.

1. En la Parte 1 calculaste qué porcentaje del pago de $2 representa la comisión en L1. En la Parte 2 modelaste cómo el batching amortiza el costo. Toma el costo por transacción de un batch de 1000 tx que calculaste y recalcula el porcentaje sobre el pago de $2. Compara ambos porcentajes (L1 vs L2 amortizado) y determina a partir de qué tamaño de batch los micropagos se vuelven viables.

2. En la Parte 3 comparaste la ventana de retiro de optimistic (7 días) vs ZK (menos de 1 hora), y en la Parte 4 viste que los optimistic dominan el TVL pese a esa desventaja. Argumenta esta aparente contradicción: si el retiro rápido es objetivamente mejor, ¿por qué el mercado prefiere mayoritariamente la opción más lenta? Cita el dato de TVL que registraste y el concepto de EVM-equivalence.

3. En la Parte 5 modelaste cómo un mensaje forjado quiebra la solvencia de un bridge, y en la Parte 6 documentaste un exploit real. Los bridges concentran una fracción pequeña del TVL total pero sufren una fracción desproporcionada de las pérdidas. Con el dato que registraste sobre esa desproporción, argumenta por qué "auditar mejor el código" no resuelve el problema de fondo. ¿Qué característica estructural del acto de conectar dos cadenas hace que el riesgo persista sin importar la calidad del código?

---

## Checklist de cierre

Antes de entregar verifica:

- [ ] Ancla de sesión y fecha de consulta de datos en vivo en la primera página
- [ ] Costo real en L1 calculado con gas y precio actuales (captura)
- [ ] TPS de L1 calculado y comparado con una L2
- [ ] Afirmación sobre aumentar tamaño de bloque refutada o confirmada (trilema)
- [ ] Simulación de batching con factor de compresión (captura)
- [ ] EIP-4844 / blobs investigado
- [ ] Ventana de fraud proof de optimistic investigada
- [ ] Comparación optimistic vs ZK ejecutada (captura)
- [ ] Distribución de TVL actual verificada en L2Beat (captura)
- [ ] Afirmación sobre ZK reemplazando optimistic refutada o confirmada con dato en vivo
- [ ] Tabla de 5 L2 con TVL, Stage y Chain ID del día (captura de L2Beat)
- [ ] Concepto de Stage 0/1/2 investigado
- [ ] Transacción real en explorador de L2 con fee comparado a L1 (captura)
- [ ] Simulación de ataque lock-and-mint ejecutada (captura)
- [ ] Cifras de pérdidas históricas de bridges con fuentes
- [ ] Exploit real analizado con causa raíz y fuente
- [ ] Matriz de riesgo de tres tipos de bridge completa
- [ ] Recomendación de arquitectura para el caso guía con tres decisiones justificadas
- [ ] Tres preguntas de reflexión respondidas con datos del laboratorio

---

**Entregable:** Reporte APA 7 con capturas de terminal, capturas de L2Beat y exploradores con fecha visible, las salidas de los simuladores, la matriz de riesgo y declaración de uso de IA.
