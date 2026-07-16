const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await ethers.getSigners();
  const saldoDeployer = await ethers.provider.getBalance(deployer.address);
  console.log("Dirección del deployer:", deployer.address);
  console.log("Saldo en Sepolia (deployer):", ethers.formatEther(saldoDeployer), "ETH");

  const contratoAddress = process.env.VITE_DIRECCION_CONTRATO || "0xCa83C7073f2AB9BF65d200DA974ba8b344Ec99db";
  const saldoContrato = await ethers.provider.getBalance(contratoAddress);
  console.log("Dirección del contrato BovedaSegura:", contratoAddress);
  console.log("Saldo del contrato BovedaSegura:", ethers.formatEther(saldoContrato), "ETH");
}

main().catch(console.error);