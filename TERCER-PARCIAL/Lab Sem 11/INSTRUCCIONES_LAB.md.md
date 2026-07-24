# Laboratorio — Identidad Descentralizada (DID)

**Materia:** Blockchain y Bases de Datos Distribuidas | **Carrera:** Ciberseguridad y Desarrollo de Software
**Tema:** Autenticación soberana y protección de la privacidad del usuario final

---

## Propósito

Al terminar este laboratorio serás capaz de:

- Generar identificadores descentralizados `did:ethr` y resolver su DID Document
- Emitir y verificar credenciales verificables (VC) firmadas criptográficamente
- Demostrar que una VC alterada es rechazada por el verificador
- Implementar divulgación selectiva y medir cuánta información revela cada esquema

**Caso guía:** Un bar debe verificar que sus clientes son mayores de edad. Hoy pide una identificación oficial: el empleado ve nombre completo, CURP, domicilio y fotografía cuando solo necesita saber si la persona rebasa cierta edad. Tu tarea es diseñar el esquema que responda esa única pregunta sin revelar nada más, y demostrar con datos cuánta información se filtra en cada alternativa.

---

## Requisitos

- Node.js 18+ y npm
- Sin blockchain ni ETH: todo el laboratorio corre localmente

**Nota de versiones verificada:** este laboratorio usa `did-jwt` y `ethr-did` con resolución offline. La librería `did-jwt-vc@4.x` aún exige el contexto `https://www.w3.org/2018/credentials/v1` aunque **VCDM 2.0 es W3C Recommendation desde mayo de 2025**. Esa brecha entre el estándar publicado y las librerías disponibles es parte de lo que analizarás.

---

## Ancla de sesión

```bash
mkdir -p ~/lab-did && cd ~/lab-did
echo "SESION: $(date '+%Y%m%d_%H%M%S') | NODE: $(node --version) | HOST: $(hostname) | USUARIO: $(whoami) | PID: $$" | tee sesion.txt
```

Copia la línea en la primera página de tu reporte. Entregas sin este valor son inválidas.

---

## Parte 1 — Prepara el entorno y estudia el modelo

```bash
cd ~/lab-did
npm init -y
npm pkg set type=module
npm install did-jwt ethr-did did-resolver ethr-did-resolver ethers@6
npm audit
```

Anota en tu reporte: cuántos paquetes se instalaron y cuántas vulnerabilidades reportó `npm audit`.

Antes de escribir código, consulta las fuentes oficiales y responde:

- **DID Core**: `https://www.w3.org/TR/did-core/` — un DID tiene tres partes separadas por dos puntos. Nómbralas y explica qué identifica cada una.
- **VCDM 2.0**: `https://www.w3.org/TR/vc-data-model-2.0/` — el modelo define tres roles. Nómbralos y describe qué hace cada uno.
- En el caso guía, ¿quién es el emisor, quién el tenedor y quién el verificador? Asigna los tres roles a actores concretos del escenario del bar.

**El punto central del modelo:** el verificador comprueba la credencial **sin contactar al emisor**. Investiga por qué eso es posible y qué propiedad criptográfica lo permite. Responde antes de continuar — el resto del laboratorio depende de que entiendas esto.

---

## Parte 2 — Genera tu DID

**Paso 2.1 — Crea el archivo**

Crea `01-generar-did.js`:

```javascript
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
writeFileSync('mi-identidad.json', JSON.stringify({
  did: ethrDid.did,
  address: wallet.address,
  privateKey: wallet.privateKey
}, null, 2));

console.log('\nIdentidad guardada en mi-identidad.json');
console.log('\n--- OBSERVACIÓN ---');
console.log('¿Cuántas transacciones se enviaron a la blockchain? Cuenta: 0');
console.log('¿Cuánto ETH costó generar esta identidad? Cuenta: 0');
```

```bash
node 01-generar-did.js
```

Anota **tu** DID completo. Lo usarás durante todo el laboratorio.

**Paso 2.2 — Descompón tu DID**

Toma tu DID y sepáralo en sus componentes:

| Parte         | Valor en TU DID | Qué significa |
| ------------- | --------------- | -------------- |
| Esquema       |                 |                |
| Método       |                 |                |
| Red           |                 |                |
| Identificador |                 |                |

Responde con base en la salida del script:

- Generaste una identidad sin enviar ninguna transacción y sin gastar ETH. ¿Dónde "existe" entonces ese DID? ¿Qué lo hace válido si no está registrado en ninguna parte?
- ¿Qué pasaría si pierdes el archivo `mi-identidad.json`? ¿Puedes recuperar el DID? ¿Puedes seguir usándolo?

**Afirmación para refutar o confirmar:** *"Un DID solo es válido si está registrado en la blockchain; por eso se llama identidad descentralizada."*

Con lo que acabas de observar en tu propia ejecución, refuta o confirma. Investiga qué es un DID method "off-chain" o de resolución determinista.

> Evidencia obligatoria: salida del script con TU DID visible.

---

## Parte 3 — Resuelve el DID Document

Un DID por sí solo es una cadena de texto. Su utilidad viene del **DID Document**: el objeto que declara qué claves pueden autenticar a ese identificador.

Crea `02-resolver-did.js`:

```javascript
import { readFileSync } from 'fs';

const identidad = JSON.parse(readFileSync('mi-identidad.json', 'utf8'));

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
```

```bash
node 02-resolver-did.js
```

Anota el DID Document completo que produjo **tu** DID.

Responde:

- El campo `authentication` declara qué claves pueden probar control del DID. El campo `assertionMethod` declara cuáles pueden firmar afirmaciones. ¿Por qué el estándar los separa en lugar de usar una sola lista?
- La clave privada no aparece en el documento. ¿Cómo verifica entonces un tercero una firma hecha con ella? Explica el mecanismo.
- Consulta `https://www.w3.org/TR/did-core/#verification-relationships` y nombra al menos dos propósitos de verificación adicionales que existen en el estándar y no aparecen en tu documento.

> Evidencia obligatoria: DID Document completo generado desde TU identidad.

---

## Parte 4 — Emite una credencial verificable

Crea `03-emitir-credencial.js`:

```javascript
import { ES256KSigner, createJWT } from 'did-jwt';
import { ethers } from 'ethers';
import { readFileSync, writeFileSync } from 'fs';

// El EMISOR es una autoridad — aquí, el registro civil
const emisorWallet = ethers.Wallet.createRandom();
const emisorDid = `did:ethr:${emisorWallet.address}`;

// El TENEDOR eres tú, con el DID de la Parte 2
const tenedor = JSON.parse(readFileSync('mi-identidad.json', 'utf8'));

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

writeFileSync('credencial.jwt', jwt);
writeFileSync('emisor.json', JSON.stringify({ did: emisorDid }, null, 2));

console.log('\n=== CREDENCIAL EMITIDA (JWT) ===');
console.log('Longitud total:', jwt.length, 'caracteres');
console.log('\nJWT completo:\n', jwt);

const [header, payload, firma] = jwt.split('.');
console.log('\n=== ESTRUCTURA DEL JWT ===');
console.log('Header  (base64url):', header.length, 'chars');
console.log('Payload (base64url):', payload.length, 'chars');
console.log('Firma   (base64url):', firma.length, 'chars');

console.log('\n=== HEADER DECODIFICADO ===');
console.log(JSON.parse(Buffer.from(header, 'base64url').toString()));

console.log('\n=== PAYLOAD DECODIFICADO ===');
const p = JSON.parse(Buffer.from(payload, 'base64url').toString());
console.log(JSON.stringify(p.vc.credentialSubject, null, 2));
```

```bash
node 03-emitir-credencial.js
```

Anota: longitud total del JWT, el DID del emisor, y el algoritmo que aparece en el header.

**El hallazgo que debes registrar:** el payload se decodificó **sin ninguna clave**. Base64url no es cifrado, es codificación.

Responde:

- Cualquiera que obtenga tu JWT puede leer los cinco campos de `credentialSubject`. Enuméralos. ¿Cuáles necesita realmente el bar del caso guía?
- Si presentas esta credencial en el bar, ¿cuántos datos personales revelas de más? Cuenta exactamente.
- El JWT lleva `nbf` y `exp`. ¿Qué significan y qué protección aportan?

> Evidencia obligatoria: JWT completo y payload decodificado mostrando todos los campos.

---

## Parte 5 — Verifica y detecta manipulación

Crea `04-verificar.js`:

```javascript
import { verifyJWT } from 'did-jwt';
import { Resolver } from 'did-resolver';
import { readFileSync } from 'fs';

const jwt = readFileSync('credencial.jwt', 'utf8').trim();

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
```

```bash
node 04-verificar.js
```

Anota ambos resultados y el mensaje exacto del rechazo.

Responde:

- El atacante no cambió la firma, solo el payload. ¿Por qué falla la verificación? Explica qué relación matemática se rompe.
- El verificador comprobó la credencial **sin contactar al emisor y sin conexión a internet**. ¿Qué información necesitó para hacerlo?
- En el caso guía, ¿qué implicaría esto para el bar? ¿Necesita convenio con el registro civil para verificar?

**Afirmación para refutar o confirmar:** *"Como el JWT es legible por cualquiera, un atacante que intercepte tu credencial puede modificar la fecha de nacimiento y usarla, porque el sistema no puede saber cuál era el valor original."*

Con tu resultado de la Verificación 2, refuta o confirma.

> Evidencia obligatoria: salida con ambas verificaciones y el mensaje de rechazo.

---

## Parte 6 — Divulgación selectiva: el eje de privacidad

Aquí resuelves el problema del caso guía.

Crea `05-divulgacion-selectiva.js`:

```javascript
import { ES256KSigner, createJWT, verifyJWT } from 'did-jwt';
import { ethers } from 'ethers';
import { Resolver } from 'did-resolver';
import { createHash, randomBytes } from 'crypto';
import { readFileSync } from 'fs';

const emisorWallet = ethers.Wallet.createRandom();
const emisorDid = `did:ethr:${emisorWallet.address}`;
const signer = ES256KSigner(ethers.getBytes(emisorWallet.privateKey), true);
const tenedor = JSON.parse(readFileSync('mi-identidad.json', 'utf8'));

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

console.log('\n=== EL SD-JWT NO CONTIENE LOS VALORES ===');
const payloadSd = JSON.parse(Buffer.from(sdJwt.split('.')[1], 'base64url').toString());
console.log(JSON.stringify(payloadSd, null, 2));

for (const [clave, valor] of Object.entries(claims)) {
  const filtrado = sdJwt.includes(String(valor));
  console.log(`¿"${clave}" visible en el JWT? ${filtrado ? 'SÍ' : 'NO'}`);
}

// El TENEDOR decide qué revelar: solo mayorDeEdad
const presentacion = `${sdJwt}~${disclosures.mayorDeEdad}~`;

console.log('\n=== PRESENTACIÓN AL VERIFICADOR ===');
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
```

```bash
node 05-divulgacion-selectiva.js
```

Anota los digests que generó **tu** ejecución y el resultado de la verificación.

Completa esta tabla con tus datos:

| Esquema               | Claims revelados | Claims ocultos | Longitud | ¿Verificable? |
| --------------------- | ---------------- | -------------- | -------- | -------------- |
| VC completa (Parte 4) |                  |                |          |                |
| SD-JWT (Parte 6)      |                  |                |          |                |

Responde:

- El bar verificó `mayorDeEdad` sin ver la CURP ni el domicilio. ¿Cómo sabe que ese valor no fue inventado por el tenedor?
- Cada disclosure incluye un `salt` aleatorio de 16 bytes. Si se omitiera, ¿qué ataque sería posible sobre el claim `mayorDeEdad`, que solo puede valer `true` o `false`? Nombra el ataque.
- Ejecuta el script **dos veces** y compara los digests del mismo claim. ¿Son iguales? ¿Por qué?

> Evidencia obligatoria: salida completa con los digests, la verificación y la lista de claims ocultos.

---

## Parte 7 — Análisis de correlación

La divulgación selectiva protege el contenido. No protege la trazabilidad.

Crea `06-correlacion.js`:

```javascript
import { readFileSync } from 'fs';

const tenedor = JSON.parse(readFileSync('mi-identidad.json', 'utf8'));

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
```

```bash
node 06-correlacion.js
```

Responde:

- En el escenario A, los negocios no conocen tu nombre pero pueden correlacionar tus visitas. ¿Es eso anonimato? Justifica la diferencia entre **anonimato** y **seudonimato**.
- El escenario B requiere una credencial por verificador. Investiga cómo resuelve ese costo una **prueba de conocimiento cero (ZKP)** aplicada a credenciales. ¿Por qué permite no correlacionabilidad sin multiplicar las credenciales?
- Tu DID de la Parte 2 es `did:ethr`, derivado de una dirección Ethereum. Si esa misma dirección recibiera ETH en Mainnet, ¿qué información pública quedaría asociada a tu identificador? Consulta qué es el análisis de cadena.

**Afirmación para refutar o confirmar:** *"Como el DID no contiene tu nombre, usar el mismo DID con todos los verificadores es seguro para tu privacidad."*

Con los resultados de ambos escenarios, refuta o confirma.

> Evidencia obligatoria: salida del script con ambos escenarios y el conteo de identificadores correlacionables.

---

## Parte 8 — Diseña el esquema del caso guía

Con todo lo que implementaste, diseña la solución completa para el bar. Entrega en tu reporte:

**8.1 — Diagrama de flujo.** Los tres roles (emisor, tenedor, verificador), qué dato viaja en cada flecha y en qué dirección. Marca explícitamente dónde **no** hay comunicación entre actores.

**8.2 — Especificación de la credencial.** Define los claims que emitiría el registro civil, y para cada uno indica si sería divulgable selectivamente o siempre oculto. Justifica cada decisión.

**8.3 — Análisis de privacidad.** Completa:

| Amenaza                                    | ¿Mitigada por tu diseño? | Mecanismo |
| ------------------------------------------ | -------------------------- | --------- |
| El bar conoce el domicilio del cliente     |                            |           |
| El bar altera la credencial                |                            |           |
| Varios bares correlacionan visitas         |                            |           |
| El emisor sabe dónde se usa la credencial |                            |           |
| Un tercero reutiliza una credencial robada |                            |           |

Para la última fila necesitas investigar: tu implementación **no** vincula la presentación al tenedor. Investiga qué es el **holder binding** en SD-JWT y describe cómo lo agregarías.

---

## Parte 9 — Reflexión final

Responde con base en lo que implementaste y mediste. Las respuestas sin tus valores propios son inválidas.

1. En la Parte 4 anotaste la longitud del JWT completo y en la Parte 6 la del SD-JWT con una sola disclosure. Calcula la diferencia en bytes y el porcentaje. Ahora escala: si el bar procesa 500 clientes por noche y almacena cada presentación por obligación legal durante un año, ¿cuántos MB de datos personales guarda con cada esquema? Con esa cifra, argumenta cuál esquema reduce el riesgo de una filtración y por qué el volumen almacenado es en sí mismo un factor de riesgo.
2. En la Parte 5 comprobaste que una credencial alterada es rechazada, y en la Parte 6 que los claims ocultos siguen comprometidos criptográficamente. Sin embargo, tu implementación no impide que alguien que **robe** la presentación completa la reutilice. Con lo que investigaste sobre holder binding, explica por qué la firma del emisor es necesaria pero no suficiente, y qué segunda firma haría falta.
3. VCDM 2.0 es W3C Recommendation desde mayo de 2025, pero la librería `did-jwt-vc@4.x` que instalaste aún exige el contexto de 2018. Documenta esa brecha: consulta el repositorio de la librería y registra la fecha de su última versión publicada. Con ese dato, argumenta qué riesgo asume un equipo que despliega identidad descentralizada en producción hoy, y qué criterio usarías para decidir entre esperar a que las librerías se alineen al estándar o implementar sobre el estándar directamente.

---

## Checklist de cierre

Antes de entregar verifica:

- [ ] Ancla de sesión en la primera página del reporte
- [ ] Resultado de `npm audit` registrado
- [ ] Tres partes de un DID y tres roles de VCDM 2.0 investigados en las fuentes oficiales
- [ ] TU DID generado y descompuesto en la tabla de cuatro componentes (captura)
- [ ] Afirmación sobre DID registrado en blockchain refutada o confirmada
- [ ] DID Document completo generado desde tu identidad (captura)
- [ ] Dos propósitos de verificación adicionales del estándar nombrados
- [ ] JWT emitido con longitud y payload decodificado (captura)
- [ ] Conteo exacto de datos personales revelados de más
- [ ] Verificación de credencial original y alterada con mensaje de rechazo (captura)
- [ ] Afirmación sobre modificación de credencial refutada o confirmada
- [ ] SD-JWT con digests propios y verificación exitosa (captura)
- [ ] Tabla comparativa VC completa vs SD-JWT con longitudes medidas
- [ ] Script ejecutado dos veces con digests comparados
- [ ] Análisis de correlación con ambos escenarios (captura)
- [ ] Afirmación sobre reutilizar el mismo DID refutada o confirmada
- [ ] Diagrama de flujo de los tres roles
- [ ] Especificación de credencial con justificación por claim
- [ ] Tabla de amenazas completa, incluyendo holder binding
- [ ] Tres preguntas de reflexión respondidas con datos del laboratorio

---

**Entregable:** Reporte APA 7 con capturas de terminal de cada script, el diagrama de flujo, las tablas comparativa y de amenazas, y declaración de uso de IA.
