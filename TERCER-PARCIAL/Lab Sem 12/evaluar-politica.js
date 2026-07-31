// Evaluador de políticas de endorsement estilo Hyperledger Fabric
// Permite verificar si una lista de firmas satisface una política de endoso dada.

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

// ---------------------------------------------------------
// PASO 3.2 — Política del caso guía: OutOf(2, Azul, Rojo, Verde)
// ---------------------------------------------------------
const politicaMorosos = {
  OutOf: [2, 'BancoAzulMSP.member', 'BancoRojoMSP.member', 'BancoVerdeMSP.member']
};

console.log('=== POLÍTICA 1: OutOf(2, Azul, Rojo, Verde) ===\n');

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

// ---------------------------------------------------------
// PASO 3.2 — Política alternativa estricta: AND(los tres)
// ---------------------------------------------------------
console.log('=== POLÍTICA ALTERNATIVA: AND(los tres) ===\n');
const politicaEstricta = {
  AND: ['BancoAzulMSP.member', 'BancoRojoMSP.member', 'BancoVerdeMSP.member']
};

for (const e of escenarios.slice(1, 4)) {
  const resultado = evaluar(politicaEstricta, e.firmas);
  console.log(`${resultado ? 'APROBADA ' : 'RECHAZADA'} | ${e.desc}`);
  console.log(`           firmas: [${e.firmas.join(', ') || 'ninguna'}]\n`);
}

// ---------------------------------------------------------
// PASO 3.3 — Política personalizada: Banco Azul obligatorio + al menos otro banco
// ---------------------------------------------------------
console.log('=== POLÍTICA 3 (PERSONALIZADA): AND(BancoAzul, OR(BancoRojo, BancoVerde)) ===\n');

const politicaAzulObligatorio = {
  AND: [
    'BancoAzulMSP.member',
    { OR: ['BancoRojoMSP.member', 'BancoVerdeMSP.member'] }
  ]
};

const escenariosPersonalizados = [
  { desc: 'Azul y Rojo firman',                    firmas: ['BancoAzulMSP.member', 'BancoRojoMSP.member'] },
  { desc: 'Azul y Verde firman',                   firmas: ['BancoAzulMSP.member', 'BancoVerdeMSP.member'] },
  { desc: 'Solo Rojo y Verde firman (sin Azul)',  firmas: ['BancoRojoMSP.member', 'BancoVerdeMSP.member'] },
  { desc: 'Solo Banco Azul firma',                 firmas: ['BancoAzulMSP.member'] },
  { desc: 'Los tres bancos firman',                firmas: ['BancoAzulMSP.member', 'BancoRojoMSP.member', 'BancoVerdeMSP.member'] }
];

for (const e of escenariosPersonalizados) {
  const resultado = evaluar(politicaAzulObligatorio, e.firmas);
  console.log(`${resultado ? 'APROBADA ' : 'RECHAZADA'} | ${e.desc}`);
  console.log(`           firmas: [${e.firmas.join(', ') || 'ninguna'}]\n`);
}
