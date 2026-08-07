// Modela un bridge lock-and-mint y su punto de vulnerabilidad

class Bridge {
  constructor() {
    this.bloqueadoEnOrigen = 0;    // activos reales bloqueados (cadena A)
    this.acunadoEnDestino = 0;     // tokens wrapped acuñados (cadena B)
    this.log = [];
  }

  // Usuario deposita en cadena origen → se acuña wrapped en destino
  bridge(monto, mensajeValido = true) {
    if (mensajeValido) {
      this.bloqueadoEnOrigen += monto;
      this.acunadoEnDestino += monto;
      this.log.push(`BRIDGE OK: +${monto} bloqueado, +${monto} acuñado`);
    } else {
      // ATAQUE: mensaje forjado — acuña SIN bloquear respaldo
      this.acunadoEnDestino += monto;
      this.log.push(`MENSAJE FORJADO: +${monto} acuñado SIN respaldo`);
    }
  }

  // La invariante que SIEMPRE debe cumplirse
  verificarSolvencia() {
    const solvente = this.bloqueadoEnOrigen >= this.acunadoEnDestino;
    return {
      bloqueado: this.bloqueadoEnOrigen,
      acunado: this.acunadoEnDestino,
      solvente,
      deficit: this.acunadoEnDestino - this.bloqueadoEnOrigen
    };
  }
}

console.log('=== OPERACIÓN NORMAL ===');
const bridge = new Bridge();
bridge.bridge(100);
bridge.bridge(50);
console.log(bridge.log.join('\n'));
console.log('Solvencia:', bridge.verificarSolvencia());

console.log('\n=== ATAQUE: MENSAJE CROSS-CHAIN FORJADO ===');
bridge.bridge(1000000, false);  // el atacante forja un mensaje
console.log(bridge.log[bridge.log.length - 1]);
const estado = bridge.verificarSolvencia();
console.log('Solvencia:', estado);
console.log(`\n¿El bridge quebró? ${!estado.solvente ? 'SÍ' : 'NO'}`);
console.log(`Déficit (tokens sin respaldo): ${estado.deficit}`);
console.log('Estos tokens acuñados sin respaldo pueden venderse,');
console.log('drenando la liquidez y colapsando el precio del wrapped token.');
