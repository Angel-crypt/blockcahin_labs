import { readFileSync } from 'fs';

const identidad = JSON.parse(readFileSync('data/mi-identidad.json', 'utf8'));

// Resolución determinista: para did:ethr sin cambios on-chain,
// el DID Document se deriva de la dirección, sin consultar la red
function resolverDidDocument(did) {
  const direccion = did.split(':').pop();
  return {
    '@context': 'https://www.w3.org/ns/did/v1',
    id: did,
    verificationMethod: [{
      id: `${did}#controller`,
      type: 'EcdsaSecp256k1RecoveryMethod2020',
      controller: did,
      blockchainAccountId: `eip155:11155111:${direccion}`
    }],
    authentication: [`${did}#controller`],
    assertionMethod: [`${did}#controller`]
  };
}

const doc = resolverDidDocument(identidad.did);

console.log('=== DID DOCUMENT ===\n');
console.log(JSON.stringify(doc, null, 2));

console.log('\n--- ANÁLISIS ---');
console.log('¿Aparece la clave privada en el documento?',
  JSON.stringify(doc).includes(identidad.privateKey) ? 'SÍ — PROBLEMA' : 'NO — correcto');
console.log('Métodos de verificación declarados:', doc.verificationMethod.length);
console.log('Propósitos declarados: authentication, assertionMethod');
