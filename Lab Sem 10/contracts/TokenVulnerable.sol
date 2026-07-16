// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ADVERTENCIA: Contrato intencionalmente vulnerable — solo uso educativo
// SWC-101: Integer Overflow and Underflow
// En Solidity ^0.8.0 el overflow es protegido por defecto.
// Sin embargo, los bloques unchecked{} desactivan esa protección.
contract TokenVulnerable {
    mapping(address => uint256) public balances;
    uint256 public totalSupply;
    address public owner;

    constructor(uint256 _supply) {
        owner = msg.sender;
        totalSupply = _supply;
        balances[msg.sender] = _supply;
    }

    // VULNERABLE: unchecked desactiva la protección de overflow de Solidity 0.8+
    // Un atacante puede hacer que su balance desborde y obtenga un valor enorme
    function transferirUnchecked(address destino, uint256 monto) external {
        unchecked {
            // Si monto > balances[msg.sender], en lugar de revertir,
            // el resultado envuelve alrededor (wraps around) a un número enorme
            balances[msg.sender] -= monto;
            balances[destino] += monto;
        }
    }

    // VULNERABLE: el límite de acuñación puede desbordarse
    function acunarUnchecked(address cuenta, uint256 monto) external {
        require(msg.sender == owner, "Solo owner");
        unchecked {
            // Si totalSupply + monto desborda, el resultado es incorrecto
            totalSupply += monto;
            balances[cuenta] += monto;
        }
    }

    // Función segura — sin unchecked, con validación explícita
    function transferirSeguro(address destino, uint256 monto) external {
        require(balances[msg.sender] >= monto, "Saldo insuficiente");
        require(destino != address(0), "Direccion invalida");
        balances[msg.sender] -= monto;
        balances[destino] += monto;
    }
}