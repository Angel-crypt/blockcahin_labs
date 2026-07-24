import { readFileSync } from 'fs';

const tenedor = JSON.parse(readFileSync('data/mi-identidad.json', 'utf8'));

console.log('=== ANÁLISIS DE CORRELACIÓN ===\n');
console.log('Tu DID:', tenedor.did);

const verificadores = ['Bar Centro', 'Bar Norte', 'Antro Sur', 'Cine Plaza', 'Casino'];

console.log('\n--- ESCENARIO A: mismo DID en todos lados ---');
verificadores.forEach((v, i) => {
  console.log(`  ${v.padEnd(12)} → recibe: ${tenedor.did}`);
});
console.log('\n  Si estos 5 negocios comparten registros:');
console.log('  → Pueden vincular las 5 visitas a UNA sola persona');
console.log('  → Construyen tu historial de consumo sin conocer tu nombre');
console.log('  → Identificadores únicos correlacionables: 1');

console.log('\n--- ESCENARIO B: DID distinto por verificador (pairwise) ---');
import { ethers } from 'ethers';
const dids = verificadores.map(v => {
  const w = ethers.Wallet.createRandom();
  return { verificador: v, did: `did:ethr:${w.address}` };
});
dids.forEach(d => console.log(`  ${d.verificador.padEnd(12)} → recibe: ${d.did}`));

console.log('\n  Si estos 5 negocios comparten registros:');
console.log('  → Ven 5 identificadores sin relación aparente');
console.log('  → No pueden vincular las visitas entre sí');
console.log('  → Identificadores únicos correlacionables:', new Set(dids.map(d => d.did)).size, '(ninguno se repite)');

console.log('\n--- COSTO DEL ESCENARIO B ---');
console.log('  Credenciales que el emisor debe emitir: ', verificadores.length);
console.log('  Pares de claves que debes custodiar:    ', verificadores.length);
console.log('  Vs. escenario A:                         1');
