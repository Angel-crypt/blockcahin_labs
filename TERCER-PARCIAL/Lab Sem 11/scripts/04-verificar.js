import { verifyJWT } from 'did-jwt';
import { Resolver } from 'did-resolver';
import { readFileSync } from 'fs';

const jwt = readFileSync('data/credencial.jwt', 'utf8').trim();

// Resolución offline simplificada
function resolverOffline() {
  return {
    ethr: async (did) => ({
      didResolutionMetadata: {},
      didDocumentMetadata: {},
      didDocument: {
        '@context': 'https://www.w3.org/ns/did/v1',
        id: did,
        verificationMethod: [{
          id: `${did}#controller`,
          type: 'EcdsaSecp256k1RecoveryMethod2020',
          controller: did,
          blockchainAccountId: `eip155:1:${did.split(':').pop()}`
        }],
        authentication: [`${did}#controller`],
        assertionMethod: [`${did}#controller`]
      }
    })
  };
}

const resolver = new Resolver(resolverOffline());

console.log('=== VERIFICACIÓN 1: CREDENCIAL ORIGINAL ===\n');
try {
  const v = await verifyJWT(jwt, { resolver });
  console.log('RESULTADO: VÁLIDA');
  console.log('Emisor verificado:', v.issuer);
  console.log('Sujeto:', v.payload.sub);
  console.log('mayorDeEdad:', v.payload.vc.credentialSubject.mayorDeEdad);
} catch (e) {
  console.log('RESULTADO: RECHAZADA —', e.message);
}

// Ataque: alterar la credencial manteniendo la firma original
console.log('\n=== VERIFICACIÓN 2: CREDENCIAL ALTERADA ===\n');

const [h, p, s] = jwt.split('.');
const payloadAlterado = JSON.parse(Buffer.from(p, 'base64url').toString());

console.log('Nombre original:', payloadAlterado.vc.credentialSubject.nombreCompleto);
payloadAlterado.vc.credentialSubject.nombreCompleto = 'ATACANTE MODIFICADO';
payloadAlterado.vc.credentialSubject.mayorDeEdad = true;
console.log('Nombre alterado: ', payloadAlterado.vc.credentialSubject.nombreCompleto);

const pFalso = Buffer.from(JSON.stringify(payloadAlterado)).toString('base64url');
const jwtFalso = `${h}.${pFalso}.${s}`;

console.log('\nJWT alterado construido. Firma: la MISMA del original.');

try {
  await verifyJWT(jwtFalso, { resolver });
  console.log('RESULTADO: ACEPTADA — FALLO DE SEGURIDAD');
} catch (e) {
  console.log('RESULTADO: RECHAZADA');
  console.log('Motivo:', e.message);
}
