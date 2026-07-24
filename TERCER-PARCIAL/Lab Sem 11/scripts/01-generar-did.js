import { EthrDID } from 'ethr-did';
import { ethers } from 'ethers';

// Genera un par de claves nuevo — este es TU identificador soberano
const wallet = ethers.Wallet.createRandom();

console.log('=== GENERACIÓN DE IDENTIDAD SOBERANA ===\n');
console.log('Frase semilla:', wallet.mnemonic.phrase);
console.log('Clave privada:', wallet.privateKey);
console.log('Dirección:    ', wallet.address);

const ethrDid = new EthrDID({
  identifier: wallet.address,
  privateKey: wallet.privateKey.slice(2),
  chainNameOrId: 'sepolia'
});

console.log('\nDID generado: ', ethrDid.did);

// Guarda la identidad para los siguientes pasos
import { writeFileSync } from 'fs';
writeFileSync('data/mi-identidad.json', JSON.stringify({
  did: ethrDid.did,
  address: wallet.address,
  privateKey: wallet.privateKey
}, null, 2));

console.log('\nIdentidad guardada en data/mi-identidad.json');
console.log('\n--- OBSERVACIÓN ---');
console.log('¿Cuántas transacciones se enviaron a la blockchain? Cuenta: 0');
console.log('¿Cuánto ETH costó generar esta identidad? Cuenta: 0');
