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
// Nota de corrección de sintaxis: JS no soporta el formato Python (e.g. :>8). Se usa padStart.
console.log(`${'N tx'.padStart(8)} ${'Bytes L1'.padStart(12)} ${'Bytes Rollup'.padStart(14)} ${'Ahorro'.padStart(10)} ${'Factor'.padStart(8)}`);

for (const n of [1, 10, 100, 1000]) {
  const r = simularBatch(n);
  console.log(`${r.transacciones.toString().padStart(8)} ${r.bytesL1.toString().padStart(12)} ${r.bytesRollup.toString().padStart(14)} ${(r.ahorroPct + '%').padStart(10)} ${(r.factorCompresion + 'x').padStart(8)}`);
}

console.log('\n=== EL COSTO SE AMORTIZA ENTRE TODOS ===\n');
// El costo fijo de publicar el batch en L1 se divide entre todas las tx
const COSTO_BATCH_L1_USD = 5.00; // costo de publicar el batch en L1
for (const n of [1, 10, 100, 1000]) {
  const costoPorTx = COSTO_BATCH_L1_USD / n;
  console.log(`Batch de ${n.toString().padStart(4)} tx → costo L1 por tx: $${costoPorTx.toFixed(4)}`);
}
