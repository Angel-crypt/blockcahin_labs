// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract BovedaSegura is ReentrancyGuard {
    mapping(address => uint256) public saldos;
    uint256 public totalFondos;

    event Deposito(address indexed cuenta, uint256 monto);
    event Retiro(address indexed cuenta, uint256 monto);

    function depositar() external payable {
        require(msg.value > 0, "Monto requerido");
        saldos[msg.sender] += msg.value;
        totalFondos += msg.value;
        emit Deposito(msg.sender, msg.value);
    }

    // SEGURO: Patrón Checks-Effects-Interactions (CEI) + reentrancy guard de OpenZeppelin
    function retirar(uint256 monto) external nonReentrant {
        require(saldos[msg.sender] >= monto, "Saldo insuficiente");
        require(monto > 0, "Monto invalido");

        // 1. EFFECT: Modificar el estado primero
        saldos[msg.sender] -= monto;
        totalFondos -= monto;

        // 2. INTERACTION: Realizar la llamada externa al final
        (bool exito, ) = msg.sender.call{value: monto}("");
        require(exito, "Transferencia fallida");

        emit Retiro(msg.sender, monto);
    }

    function consultarSaldo(address cuenta) external view returns (uint256) {
        return saldos[cuenta];
    }
}
