import { ES256KSigner, createJWT, verifyJWT } from 'did-jwt';
import { ethers } from 'ethers';
import { Resolver } from 'did-resolver';
import { createHash, randomBytes } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';

const emisorWallet = ethers.Wallet.createRandom();
const emisorDid = `did:ethr:${emisorWallet.address}`;
const signer = ES256KSigner(ethers.getBytes(emisorWallet.privateKey), true);
const tenedor = JSON.parse(readFileSync('data/mi-identidad.json', 'utf8'));

const claims = {
  nombreCompleto: 'Ana Patricia Lopez Ramirez',
  curp: 'LORA010315MDFPMN04',
  fechaNacimiento: '2001-03-15',
  domicilio: 'Av. Reforma 123, Aguascalientes',
  mayorDeEdad: true
};

console.log('=== CONSTRUCCIÓN DE SD-JWT ===\n');

// Cada claim se convierte en una "disclosure": [salt, nombre, valor]
// El JWT solo contiene el HASH de cada disclosure, no el valor
const disclosures = {};
const digests = {};

for (const [clave, valor] of Object.entries(claims)) {
  const salt = randomBytes(16).toString('base64url');
  const disclosure = Buffer.from(JSON.stringify([salt, clave, valor])).toString('base64url');
  disclosures[clave] = disclosure;
  digests[clave] = createHash('sha256').update(disclosure).digest('base64url');
  console.log(`${clave.padEnd(18)} → digest: ${digests[clave].slice(0, 24)}...`);
}

const sdJwt = await createJWT(
  { sub: tenedor.did, _sd: Object.values(digests), _sd_alg: 'sha-256' },
  { issuer: emisorDid, signer },
  { alg: 'ES256K-R' }
);

writeFileSync('data/sd-credencial.jwt', sdJwt);
writeFileSync('data/disclosures.json', JSON.stringify(disclosures, null, 2));

console.log('\n=== EL SD-JWT NO CONTIENE LOS VALORES ===');
const payloadSd = JSON.parse(Buffer.from(sdJwt.split('.')[1], 'base64url').toString());
console.log(JSON.stringify(payloadSd, null, 2));

for (const [clave, valor] of Object.entries(claims)) {
  const filtrado = sdJwt.includes(String(valor));
  console.log(`¿"${clave}" visible en el JWT? ${filtrado ? 'SÍ' : 'NO'}`);
}

// El TENEDOR decide qué revelar: solo mayorDeEdad
const presentacion = `${sdJwt}~${disclosures.mayorDeEdad}~`;
writeFileSync('data/presentacion-sd.jwt', presentacion);

console.log('\n=== PRESENTACIÓN AL VERIFICADOR ===');
console.log('Longitud total presentación:', presentacion.length, 'caracteres');
console.log('Claims emitidos:  ', Object.keys(claims).length);
console.log('Claims revelados: 1 (mayorDeEdad)');
console.log('Claims ocultos:   ', Object.keys(claims).length - 1);

// El verificador procesa la presentación
const [jwtRecibido, ...disclosuresRecibidas] = presentacion.split('~').filter(Boolean);
const resolver = new Resolver({
  ethr: async (did) => ({
    didResolutionMetadata: {}, didDocumentMetadata: {},
    didDocument: {
      '@context': 'https://www.w3.org/ns/did/v1', id: did,
      verificationMethod: [{ id: `${did}#c`, type: 'EcdsaSecp256k1RecoveryMethod2020',
        controller: did, blockchainAccountId: `eip155:1:${did.split(':').pop()}` }],
      authentication: [`${did}#c`], assertionMethod: [`${did}#c`]
    }
  })
});

console.log('\n=== VERIFICACIÓN DEL LADO DEL BAR ===');
const verificado = await verifyJWT(jwtRecibido, { resolver });
console.log('Firma del emisor: VÁLIDA');

for (const d of disclosuresRecibidas) {
  const digestCalculado = createHash('sha256').update(d).digest('base64url');
  const incluido = verificado.payload._sd.includes(digestCalculado);
  const [, clave, valor] = JSON.parse(Buffer.from(d, 'base64url').toString());
  console.log(`Claim "${clave}" = ${valor} → digest coincide: ${incluido ? 'SÍ' : 'NO'}`);
}

console.log('\n=== LO QUE EL BAR NUNCA VIO ===');
Object.keys(claims).filter(k => k !== 'mayorDeEdad')
  .forEach(k => console.log(`  ${k}: [oculto, pero comprometido criptográficamente]`));
