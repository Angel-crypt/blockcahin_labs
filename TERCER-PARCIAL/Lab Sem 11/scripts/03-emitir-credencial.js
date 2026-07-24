import { ES256KSigner, createJWT } from 'did-jwt';
import { ethers } from 'ethers';
import { readFileSync, writeFileSync } from 'fs';

// El EMISOR es una autoridad — aquí, el registro civil
const emisorWallet = ethers.Wallet.createRandom();
const emisorDid = `did:ethr:${emisorWallet.address}`;

// El TENEDOR eres tú, con el DID de la Parte 2
const tenedor = JSON.parse(readFileSync('data/mi-identidad.json', 'utf8'));

console.log('=== EMISIÓN DE CREDENCIAL ===\n');
console.log('Emisor  (registro civil):', emisorDid);
console.log('Tenedor (tú):            ', tenedor.did);

const signer = ES256KSigner(ethers.getBytes(emisorWallet.privateKey), true);

const credencial = {
  sub: tenedor.did,
  nbf: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 31536000,
  vc: {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential', 'CredencialIdentidad'],
    credentialSubject: {
      nombreCompleto: 'Ana Patricia Lopez Ramirez',
      curp: 'LORA010315MDFPMN04',
      fechaNacimiento: '2001-03-15',
      domicilio: 'Av. Reforma 123, Aguascalientes',
      mayorDeEdad: true
    }
  }
};

const jwt = await createJWT(credencial, { issuer: emisorDid, signer }, { alg: 'ES256K-R' });

writeFileSync('data/credencial.jwt', jwt);
writeFileSync('data/emisor.json', JSON.stringify({ did: emisorDid }, null, 2));

console.log('\n=== CREDENCIAL EMITIDA (JWT) ===');
console.log('Longitud total:', jwt.length, 'caracteres');
console.log('\nJWT completo:\n', jwt);

const [header, payload, firma] = jwt.split('.');
console.log('\n=== ESTRUCTURA DEL JWT ===');
console.log('Header  (base64url):', header.length, 'chars');
console.log('Payload (base64url):', payload.length, 'chars');
console.log('Firma   (base64url):', firma.length, 'chars');

console.log('\n=== HEADER DECODIFICADO ===');
console.log(JSON.stringify(JSON.parse(Buffer.from(header, 'base64url').toString()), null, 2));

console.log('\n=== PAYLOAD DECODIFICADO ===');
const p = JSON.parse(Buffer.from(payload, 'base64url').toString());
console.log(JSON.stringify(p.vc.credentialSubject, null, 2));
