// Calculates the real cost of a transaction based on current parameters
// Values fetched from Etherscan and previous labs

// REEMPLAZAR con los valores consultados en vivo
const GAS_USADO = 46478;        // Gas de tu transacción del Lab 10 (Depósito: 46478, Retiro: 29431)
const GAS_PRICE_GWEI = 0.19;    // Del gas tracker de Etherscan en vivo (hoy ~0.19 Gwei)
const PRECIO_ETH_USD = 1920;    // Consúltalo en vivo (hoy ~$1920 USD)

const costoEth = (GAS_USADO * GAS_PRICE_GWEI) / 1e9;
const costoUsd = costoEth * PRECIO_ETH_USD;

console.log('=== COSTO EN ETHEREUM L1 ===');
console.log(`Gas usado:        ${GAS_USADO}`);
console.log(`Gas price:        ${GAS_PRICE_GWEI} Gwei`);
console.log(`Costo en ETH:     ${costoEth.toFixed(6)} ETH`);
console.log(`Costo en USD:     $${costoUsd.toFixed(2)}`);

console.log('\n=== VIABILIDAD PARA MICROPAGOS DE $2 ===');
const pagoMicro = 2.00;
console.log(`Pago del cliente:      $${pagoMicro.toFixed(2)}`);
console.log(`Comisión de red:       $${costoUsd.toFixed(2)}`);
console.log(`Comisión como % pago:  ${(costoUsd/pagoMicro*100).toFixed(1)}%`);
console.log(`¿Viable?               ${costoUsd < pagoMicro * 0.05 ? 'SÍ' : 'NO'}`);
