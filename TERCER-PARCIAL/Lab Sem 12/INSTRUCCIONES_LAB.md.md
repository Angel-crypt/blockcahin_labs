# Laboratorio — Blockchain Privadas: Consorcio vs. Red Pública
**Materia:** Blockchain y Bases de Datos Distribuidas | **Carrera:** Ciberseguridad y Desarrollo de Software
**Tema:** Arquitecturas de consorcio (Hyperledger Fabric) frente a redes públicas en entornos empresariales

---

## Propósito

Al terminar este laboratorio serás capaz de:

- Modelar la arquitectura de una red de consorcio Fabric: organizaciones, MSP, canales y políticas de endorsement
- Escribir y evaluar políticas de endorsement con la sintaxis real de Fabric
- Contrastar con evidencia el modelo de confianza, privacidad y control de acceso entre Fabric y una red pública
- Recomendar la arquitectura adecuada para un requerimiento empresarial concreto, justificando con criterios técnicos

**Caso guía:** Tres bancos quieren compartir un registro de clientes morosos para reducir fraude. Requisitos: solo los tres bancos ven los datos, ninguna transacción se aprueba sin el acuerdo de al menos dos de ellos, y ningún competidor externo puede leer el libro mayor. Un consultor propone Ethereum. Tú debes evaluar si una red pública satisface esos requisitos o si el caso exige una arquitectura de consorcio, y demostrarlo.

---

## Requisitos

- Node.js 18+ (para el evaluador de políticas)
- Acceso a la documentación oficial de Hyperledger Fabric
- El contrato `BovedaSegura` en Sepolia de laboratorios anteriores (para el contraste)

**Nota de vigencia — verificada contra la documentación oficial:**

- **Hyperledger Fabric v2.5.x** es la release LTS actual para producción.
- **Fabric v3.0** (disponible desde septiembre de 2024) agregó consenso Byzantine Fault Tolerant con la librería SmartBFT; es la primera versión con orderer BFT.
- Los SDK legacy (Node/Java/Go 2.2) están deprecados; el reemplazo es el **Fabric Gateway client API**.
- Este laboratorio modela la arquitectura sin desplegar la red completa. La sintaxis de políticas y MSP corresponde a la documentación de la release 2.5.

---

## Ancla de sesión

```bash
mkdir -p ~/lab-fabric && cd ~/lab-fabric
echo "SESION: $(date '+%Y%m%d_%H%M%S') | NODE: $(node --version) | HOST: $(hostname) | USUARIO: $(whoami) | PID: $$" | tee sesion.txt
```

Copia la línea en la primera página de tu reporte. Entregas sin este valor son inválidas.

---

## Parte 1 — Los cuatro pilares de una red de consorcio

Antes de modelar, investiga en la documentación oficial y responde. Cada concepto tiene una página oficial que debes consultar.

**1.1 — Permissioned vs permissionless.** Consulta `https://hyperledger-fabric.readthedocs.io/en/release-2.5/whatis.html`. En una red pública como Ethereum, cualquiera puede unirse y validar. En Fabric, no. Define qué significa "permissioned" y qué componente decide quién puede participar.

**1.2 — MSP (Membership Service Provider).** Consulta `https://hyperledger-fabric.readthedocs.io/en/release-2.5/membership/membership.html`. ¿Qué es un MSP y qué relación tiene con una Autoridad Certificadora (CA)? En Ethereum tu identidad es un par de claves anónimo; en Fabric es un certificado X.509 emitido por una CA. ¿Qué implica esa diferencia para la rendición de cuentas (accountability)?

**1.3 — Canales (channels).** Consulta la documentación de channels. Un canal es un subconjunto privado de comunicación entre organizaciones. ¿Por qué dos organizaciones en el mismo canal comparten un libro mayor, pero una tercera fuera del canal no puede verlo? Relaciónalo con el requisito de privacidad del caso guía.

**1.4 — Ordering service.** En Ethereum el consenso lo hacen validadores mediante PoS. En Fabric existe un servicio de ordenamiento separado. Consulta qué es y responde: Fabric 3.0 introdujo SmartBFT. ¿Qué garantía aporta un orderer BFT que uno basado en Raft (crash fault tolerant) no aporta? Cita la fuente.

**Afirmación para refutar o confirmar:** *"Hyperledger Fabric es una blockchain igual que Ethereum, solo que privada; por lo demás funcionan igual: ambas minan bloques y pagan comisiones de gas a los validadores."*

Con lo que investigaste, identifica al menos tres errores concretos en esa afirmación.

---

## Parte 2 — Modela la red del consorcio

**Paso 2.1 — Define las organizaciones**

Crea `red-consorcio.json` que modela los tres bancos del caso guía:

```json
{
  "consorcio": "RegistroMorosos",
  "organizaciones": [
    {
      "nombre": "BancoAzulMSP",
      "tipo": "peer",
      "ca": "ca.bancoazul.example.com",
      "peers": ["peer0.bancoazul", "peer1.bancoazul"],
      "rol": "Endorser + Committer"
    },
    {
      "nombre": "BancoRojoMSP",
      "tipo": "peer",
      "ca": "ca.bancorojo.example.com",
      "peers": ["peer0.bancorojo", "peer1.bancorojo"],
      "rol": "Endorser + Committer"
    },
    {
      "nombre": "BancoVerdeMSP",
      "tipo": "peer",
      "ca": "ca.bancoverde.example.com",
      "peers": ["peer0.bancoverde", "peer1.bancoverde"],
      "rol": "Endorser + Committer"
    },
    {
      "nombre": "OrdenadorMSP",
      "tipo": "orderer",
      "ca": "ca.ordenador.example.com",
      "nodos": ["orderer0", "orderer1", "orderer2", "orderer3"],
      "consenso": "BFT (SmartBFT)",
      "rol": "Ordering Service"
    }
  ],
  "canales": [
    {
      "nombre": "canal-morosos",
      "miembros": ["BancoAzulMSP", "BancoRojoMSP", "BancoVerdeMSP"],
      "descripcion": "Libro mayor privado del registro de morosos"
    }
  ]
}
```

Con este modelo responde en tu reporte:

- El ordering service tiene 4 nodos y usa BFT. Con la regla de que BFT tolera hasta menos de un tercio de nodos maliciosos, ¿cuántos nodos comprometidos puede soportar esta configuración sin fallar? Muestra el cálculo.
- Un cuarto banco quiere unirse. En Ethereum simplemente conectaría un nodo. En este consorcio, ¿qué pasos administrativos se requieren? Investiga qué es una actualización de configuración de canal (channel config update) y qué política debe satisfacerse.

**Paso 2.2 — Diseña el flujo de una transacción**

En Fabric el flujo es **execute-order-validate**, distinto del **order-execute** de Ethereum. En tu reporte, ordena y describe las fases de una transacción en tu red de morosos:

`propuesta` · `endorsement (simulación en peers)` · `recolección de firmas` · `envío al orderer` · `ordenamiento en bloque` · `validación contra política` · `commit al ledger`

Para cada fase indica: ¿qué organización participa? ¿en qué punto se verifica la política de endorsement?

Responde: en Ethereum, cada nodo ejecuta cada transacción. En Fabric execute-order-validate, solo los peers endorsers ejecutan. ¿Qué ventaja de rendimiento y de confidencialidad aporta que no todos ejecuten todo?

> Evidencia obligatoria: tu `red-consorcio.json` y el diagrama del flujo execute-order-validate con las fases anotadas.

---

## Parte 3 — Escribe y evalúa políticas de endorsement

El corazón del caso guía es el requisito "ninguna transacción sin el acuerdo de al menos dos bancos". Eso se expresa como una política de endorsement.

**Paso 3.1 — Aprende la sintaxis oficial**

La sintaxis de Fabric usa operadores `AND`, `OR` y `OutOf`. Ejemplos de la documentación oficial:

- `AND('Org1MSP.member', 'Org2MSP.member')` — requiere firma de ambas organizaciones
- `OR('Org1MSP.member', 'Org2MSP.member')` — requiere firma de cualquiera
- `OutOf(2, 'Org1MSP.member', 'Org2MSP.member', 'Org3MSP.member')` — requiere 2 de 3

**Paso 3.2 — Implementa el evaluador**

Crea `evaluar-politica.js`:

```javascript
// Evaluador simplificado de políticas de endorsement estilo Fabric
// Modela cómo Fabric valida si las firmas recolectadas satisfacen la política

function evaluar(politica, firmasRecolectadas) {
  const firmas = new Set(firmasRecolectadas);

  function evalNodo(nodo) {
    if (typeof nodo === 'string') {
      return firmas.has(nodo);
    }
    if (nodo.AND) {
      return nodo.AND.every(evalNodo);
    }
    if (nodo.OR) {
      return nodo.OR.some(evalNodo);
    }
    if (nodo.OutOf) {
      const [n, ...miembros] = nodo.OutOf;
      const cumplidas = miembros.filter(evalNodo).length;
      return cumplidas >= n;
    }
    return false;
  }

  return evalNodo(politica);
}

// Política del caso guía: al menos 2 de los 3 bancos
const politicaMorosos = {
  OutOf: [2, 'BancoAzulMSP.member', 'BancoRojoMSP.member', 'BancoVerdeMSP.member']
};

console.log('=== POLÍTICA: OutOf(2, Azul, Rojo, Verde) ===\n');

const escenarios = [
  { desc: 'Solo Banco Azul firma',                 firmas: ['BancoAzulMSP.member'] },
  { desc: 'Azul y Rojo firman',                    firmas: ['BancoAzulMSP.member', 'BancoRojoMSP.member'] },
  { desc: 'Los tres bancos firman',                firmas: ['BancoAzulMSP.member', 'BancoRojoMSP.member', 'BancoVerdeMSP.member'] },
  { desc: 'Rojo y Verde firman',                   firmas: ['BancoRojoMSP.member', 'BancoVerdeMSP.member'] },
  { desc: 'Nadie firma',                           firmas: [] },
  { desc: 'Un externo intenta firmar',             firmas: ['BancoAzulMSP.member', 'HackerMSP.member'] }
];

for (const e of escenarios) {
  const resultado = evaluar(politicaMorosos, e.firmas);
  console.log(`${resultado ? 'APROBADA ' : 'RECHAZADA'} | ${e.desc}`);
  console.log(`           firmas: [${e.firmas.join(', ') || 'ninguna'}]\n`);
}

// Compara con una política AND estricta
console.log('=== POLÍTICA ALTERNATIVA: AND(los tres) ===\n');
const politicaEstricta = {
  AND: ['BancoAzulMSP.member', 'BancoRojoMSP.member', 'BancoVerdeMSP.member']
};

for (const e of escenarios.slice(1, 4)) {
  const resultado = evaluar(politicaEstricta, e.firmas);
  console.log(`${resultado ? 'APROBADA ' : 'RECHAZADA'} | ${e.desc}`);
}
```

```bash
node evaluar-politica.js
```

Anota en tu reporte qué escenarios aprobó y cuáles rechazó cada política.

Responde:

- Con la política `OutOf(2, ...)`, ¿el escenario donde un externo (`HackerMSP`) firma junto con Azul fue aprobado o rechazado? ¿Por qué? ¿Qué componente garantiza que `HackerMSP` ni siquiera tenga un certificado válido?
- La política `AND(los tres)` es más estricta. ¿Qué problema operativo tendría el consorcio si un banco tiene sus peers caídos por mantenimiento? Relaciónalo con disponibilidad.
- El caso guía pide "al menos dos". ¿Cuál de las dos políticas satisface el requisito exacto? Justifica.

**Paso 3.3 — Diseña tu propia política**

Un cuarto requisito aparece: el Banco Azul es el fundador del consorcio y su firma debe ser obligatoria en toda transacción, además de requerir al menos otro banco. Escribe la política que satisface esto usando la sintaxis de Fabric (combina `AND` y `OR`). Impleméntala en el evaluador y demuestra con al menos tres escenarios que funciona.

> Evidencia obligatoria: salida de `evaluar-politica.js` con los escenarios de ambas políticas, y tu política personalizada funcionando.

---

## Parte 4 — Contraste directo con la red pública

Ahora comparas con la dApp de Sepolia que construiste en laboratorios anteriores.

**Paso 4.1 — Privacidad del libro mayor**

Abre tu contrato en `https://sepolia.etherscan.io/address/TU_DIRECCION`. Ve a la pestaña de transacciones.

Responde con lo que ves:
- ¿Puedes ver todas las transacciones de tu contrato sin ser dueño ni tener permiso? Cuenta cuántas hay visibles.
- ¿Puedes ver las direcciones que interactuaron con él?
- En el caso guía, si los bancos usaran este contrato público, ¿un competidor podría ver el registro de morosos? Justifica con lo que observas en Etherscan.

**Paso 4.2 — Control de acceso a nivel de red**

Completa esta tabla contrastando ambos modelos con lo que aprendiste:

| Dimensión | Ethereum (Sepolia) | Fabric (consorcio) |
|---|---|---|
| ¿Quién puede unirse como nodo? | | |
| ¿Quién puede leer el ledger? | | |
| Identidad de los participantes | | |
| ¿Quién ordena las transacciones? | | |
| Costo por transacción | | |
| ¿Datos visibles públicamente? | | |
| Mecanismo de consenso | | |
| ¿Quién controla las reglas de la red? | | |

**Paso 4.3 — El costo**

En la Parte 6 del laboratorio de dApps mediste el gas de una transacción en Sepolia. En Fabric no hay gas.

Responde: ¿por qué Fabric no necesita un token ni cobra gas por transacción? Investiga qué previene el gas en Ethereum (el problema de parada, ataques DoS) y cómo Fabric aborda ese mismo problema sin un mecanismo económico. Pista: revisa la relación entre permissioned y confianza entre participantes.

**Afirmación para refutar o confirmar:** *"Como Fabric no cobra gas y es más rápido, es superior a Ethereum para cualquier caso de uso empresarial."*

Con tu tabla de la Parte 4.2, refuta o confirma. Identifica al menos un escenario empresarial donde una red pública sería preferible a un consorcio.

> Evidencia obligatoria: captura de las transacciones públicas de tu contrato en Etherscan, y la tabla comparativa completa.

---

## Parte 5 — Matriz de decisión

Aplica lo aprendido a decisiones de arquitectura. Para cada requerimiento empresarial, decide qué arquitectura corresponde y justifica.

Completa la tabla:

| Requerimiento empresarial | ¿Pública o Consorcio? | Justificación técnica (1 criterio concreto) |
|---|---|---|
| Registro de morosos entre 3 bancos (caso guía) | | |
| Token para recaudar fondos del público global | | |
| Trazabilidad de una cadena de suministro entre socios conocidos | | |
| Sistema de votación abierto verificable por cualquier ciudadano | | |
| Compartir historiales médicos entre 5 hospitales de una red | | |
| Mercado de NFT abierto a cualquier artista | | |

Con tu matriz, deriva la regla general: ¿qué dos o tres características del requerimiento determinan si conviene consorcio o red pública? Formula la regla en una o dos oraciones.

---

## Parte 6 — Reflexión final

Responde con base en lo que modelaste, evaluaste y contrastaste. Respuestas sin referencia a tus resultados propios son inválidas.

1. En la Parte 3 el evaluador rechazó el escenario donde `HackerMSP` intentaba firmar. En la Parte 4.1 comprobaste que cualquiera puede leer las transacciones de tu contrato en Sepolia. Combina ambos hallazgos: el caso guía tiene dos requisitos de seguridad —control de escritura (solo 2 de 3 bancos aprueban) y control de lectura (nadie más ve los datos)—. ¿Cuál de los dos requisitos puede satisfacer un contrato inteligente en Ethereum y cuál es imposible en una red pública por diseño? Explica por qué la privacidad de lectura es un problema estructural, no de programación, en Ethereum.

2. En la Parte 2 calculaste cuántos nodos maliciosos tolera el orderer BFT de tu consorcio. Compara esa cifra con la seguridad de Ethereum, que resiste ataques mientras menos del 51% del stake sea malicioso. ¿Por qué un consorcio de pocos nodos conocidos puede usar un umbral distinto (un tercio) al de una red pública de miles de validadores anónimos? Relaciona tu respuesta con la diferencia entre confianza entre identidades conocidas y confianza entre actores anónimos.

3. Fabric 2.5 sigue siendo la LTS de producción aunque Fabric 3.0 con BFT existe desde 2024. En el laboratorio de dApps observaste que las librerías de Ethereum a veces van por detrás del estándar W3C. Con ambos casos, argumenta: en un entorno empresarial que exige soporte a largo plazo, ¿por qué una organización elegiría la versión LTS estable sobre la más reciente con más features? ¿Qué criterio de riesgo guía esa decisión?

---

## Checklist de cierre

Antes de entregar verifica:

- [ ] Ancla de sesión en la primera página del reporte
- [ ] Cuatro pilares investigados en la documentación oficial (permissioned, MSP, canales, ordering)
- [ ] Afirmación "Fabric es Ethereum privado" refutada con tres errores concretos
- [ ] `red-consorcio.json` modelado con los tres bancos y el orderer
- [ ] Cálculo de tolerancia BFT del orderer mostrado
- [ ] Flujo execute-order-validate diagramado con sus fases
- [ ] Evaluador de políticas ejecutado con ambas políticas (captura)
- [ ] Escenario de firma externa (HackerMSP) documentado
- [ ] Política personalizada (Azul obligatorio + otro banco) implementada y probada
- [ ] Transacciones públicas de tu contrato en Etherscan observadas (captura)
- [ ] Tabla comparativa Ethereum vs Fabric completa
- [ ] Explicación de por qué Fabric no necesita gas
- [ ] Afirmación "Fabric es superior siempre" refutada con un contraejemplo
- [ ] Matriz de decisión de seis requerimientos completa con justificaciones
- [ ] Regla general de decisión formulada
- [ ] Tres preguntas de reflexión respondidas con datos del laboratorio

---

**Entregable:** Reporte APA 7 con el modelo JSON de la red, el diagrama de flujo, las salidas del evaluador de políticas, las tablas comparativa y de decisión, capturas de Etherscan y declaración de uso de IA.
