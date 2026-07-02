// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TokenSeguro {
    mapping(address => uint256) public balances;
    uint256 public totalSupply;
    address public owner;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Mint(address indexed to, uint256 value);

    constructor(uint256 _supply) {
        owner = msg.sender;
        totalSupply = _supply;
        balances[msg.sender] = _supply;
    }

    // SEGURO: Aritmética protegida nativamente por Solidity 0.8+ (sin bloques unchecked)
    function transferir(address destino, uint256 monto) external {
        require(balances[msg.sender] >= monto, "Saldo insuficiente");
        require(destino != address(0), "Direccion invalida");

        balances[msg.sender] -= monto;
        balances[destino] += monto;
        emit Transfer(msg.sender, destino, monto);
    }

    // SEGURO: Aritmética protegida y validación del emisor
    function acuner(address cuenta, uint256 monto) external {
        require(msg.sender == owner, "Solo owner");
        require(cuenta != address(0), "Direccion invalida");

        totalSupply += monto;
        balances[cuenta] += monto;
        emit Mint(cuenta, monto);
    }
}
