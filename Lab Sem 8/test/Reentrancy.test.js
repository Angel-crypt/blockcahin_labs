import assert from "assert";
import pkg from "hardhat";
const { ethers } = pkg;

describe("Ataque de Reentrancy (BovedaVulnerable)", function () {
  let boveda;
  let atacante;
  let owner;
  let victima1;
  let victima2;
  let cuentaAtacante;

  beforeEach(async function () {
    [owner, victima1, victima2, cuentaAtacante] = await ethers.getSigners();

    const BovedaFactory = await ethers.getContractFactory("BovedaVulnerable");
    boveda = await BovedaFactory.deploy();

    await boveda.connect(victima1).depositar({ value: ethers.parseEther("3.0") });
    await boveda.connect(victima2).depositar({ value: ethers.parseEther("2.0") });

    const AtacanteFactory = await ethers.getContractFactory("AtacanteReentrancy");
    atacante = await AtacanteFactory.deploy(boveda.target);
  });

  it("Debería drenar todos los fondos de la Bóveda mediante reentrada", async function () {
    const saldoInicialBoveda = await ethers.provider.getBalance(boveda.target);
    console.log(`\n========================================`);
    console.log(`Saldo inicial de la víctima (Bóveda): ${ethers.formatEther(saldoInicialBoveda)} ETH`);
    console.log(`Saldo inicial del contrato atacante: ${ethers.formatEther(await ethers.provider.getBalance(atacante.target))} ETH`);

    console.log(`\n--- Ejecutando exploit con 1 ETH de depósito inicial ---`);
    await atacante.connect(cuentaAtacante).ejecutarAtaque({ value: ethers.parseEther("1.0") });

    const saldoFinalBoveda = await ethers.provider.getBalance(boveda.target);
    const saldoFinalAtacante = await ethers.provider.getBalance(atacante.target);
    const llamadasReceive = await atacante.llamadasReceive();

    console.log(`\n================ RESULTADOS ================`);
    console.log(`Llamadas recursivas recibidas por receive(): ${llamadasReceive}`);
    console.log(`Saldo final de la víctima (Bóveda): ${ethers.formatEther(saldoFinalBoveda)} ETH`);
    console.log(`Saldo final del contrato atacante: ${ethers.formatEther(saldoFinalAtacante)} ETH (1 ETH inicial + 5 ETH drenados)`);
    console.log(`========================================\n`);

    assert.strictEqual(saldoFinalBoveda.toString(), "0");
    assert.strictEqual(saldoFinalAtacante.toString(), ethers.parseEther("6.0").toString());
    assert.ok(Number(llamadasReceive) > 0);
  });
});
