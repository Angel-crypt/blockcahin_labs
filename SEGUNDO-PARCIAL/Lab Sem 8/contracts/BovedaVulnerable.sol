// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ADVERTENCIA: Contrato intencionalmente vulnerable — solo uso educativo
// SWC-107: Reentrancy
contract BovedaVulnerable {
    mapping(address => uint256) public saldos;
    uint256 public totalFondos;

    event Deposito(address cuenta, uint256 monto);
    event Retiro(address cuenta, uint256 monto);

    function depositar() external payable {
        require(msg.value > 0, "Monto requerido");
        saldos[msg.sender] += msg.value;
        totalFondos += msg.value;
        emit Deposito(msg.sender, msg.value);
    }

    // VULNERABLE: Interaction antes de Effect
    // El saldo no se actualiza antes de la transferencia externa
    function retirar(uint256 monto) external {
        require(saldos[msg.sender] >= monto, "Saldo insuficiente");
        require(monto > 0, "Monto invalido");

        // INTERACTION primero — vulnerabilidad crítica
        (bool exito, ) = msg.sender.call{value: monto}("");
        require(exito, "Transferencia fallida");

        // EFFECT después — demasiado tarde (envoltura unchecked para simular vulnerabilidad pre-0.8.0)
        unchecked {
            saldos[msg.sender] -= monto;
            totalFondos -= monto;
        }

        emit Retiro(msg.sender, monto);
    }

    function consultarSaldo(address cuenta) external view returns (uint256) {
        return saldos[cuenta];
    }
}