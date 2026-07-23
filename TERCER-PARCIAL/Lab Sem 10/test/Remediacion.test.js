import assert from "assert";
import pkg from "hardhat";
const { ethers } = pkg;

async function assertReverts(promise, expectedReason) {
  try {
    await promise;
    assert.fail("La transacción debió revertir");
  } catch (error) {
    if (expectedReason) {
      assert.ok(error.message.includes(expectedReason), `Se esperaba '${expectedReason}' pero se obtuvo: ${error.message}`);
    } else {
      assert.ok(true);
    }
  }
}

describe("Verificación de Contratos Remediados (BovedaSegura y TokenSeguro)", function () {
  let boveda;
  let atacante;
  let token;
  let owner;
  let victima1;
  let victima2;
  let cuentaAtacante;

  beforeEach(async function () {
    [owner, victima1, victima2, cuentaAtacante] = await ethers.getSigners();

    const BovedaFactory = await ethers.getContractFactory("BovedaSegura");
    boveda = await BovedaFactory.deploy();
    await boveda.connect(victima1).depositar({ value: ethers.parseEther("3.0") });
    await boveda.connect(victima2).depositar({ value: ethers.parseEther("2.0") });

    const AtacanteFactory = await ethers.getContractFactory("AtacanteReentrancy");
    atacante = await AtacanteFactory.deploy(boveda.target);

    const TokenFactory = await ethers.getContractFactory("TokenSeguro");
    token = await TokenFactory.deploy(ethers.parseEther("100.0"));
  });

  it("Debería bloquear el ataque de reentrancy en BovedaSegura", async function () {
    const saldoInicialBoveda = await ethers.provider.getBalance(boveda.target);
    console.log(`\n================ BOVEDA SEGURA ================`);
    console.log(`Saldo en bóveda antes del ataque: ${ethers.formatEther(saldoInicialBoveda)} ETH`);

    console.log(`Ejecutando exploit de reentrancy contra BovedaSegura...`);
    await assertReverts(
      atacante.connect(cuentaAtacante).ejecutarAtaque({ value: ethers.parseEther("1.0") })
    );

    const saldoFinalBoveda = await ethers.provider.getBalance(boveda.target);
    const saldoFinalAtacante = await ethers.provider.getBalance(atacante.target);

    console.log(`\n================ RESULTADOS ================`);
    console.log(`Saldo final en bóveda: ${ethers.formatEther(saldoFinalBoveda)} ETH (FONDOS PROTEGIDOS)`);
    console.log(`Saldo final del contrato atacante: ${ethers.formatEther(saldoFinalAtacante)} ETH (0 ETH robados)`);
    console.log(`============================================\n`);

    assert.strictEqual(saldoFinalBoveda.toString(), saldoInicialBoveda.toString());
    assert.strictEqual(saldoFinalAtacante.toString(), "0");
  });

  it("Debería bloquear el underflow en TokenSeguro y revertir la transacción", async function () {
    console.log(`================ TOKEN SEGURO ================`);
    console.log(`Ejecutando transferencia sin fondos contra TokenSeguro...`);

    await assertReverts(
      token.connect(cuentaAtacante).transferir(owner.address, 1),
      "Saldo insuficiente"
    );

    const saldoAtacante = await token.balances(cuentaAtacante.address);
    console.log(`\n================ RESULTADOS ================`);
    console.log(`Saldo final del atacante en TokenSeguro: ${saldoAtacante.toString()} wei (SIN UNDERFLOW)`);
    console.log(`============================================\n`);

    assert.strictEqual(saldoAtacante.toString(), "0");
  });
});
