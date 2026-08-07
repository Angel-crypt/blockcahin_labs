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
