// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CajaDeAhorro {

    struct Movimiento {
        string tipo;
        uint256 monto;
        uint256 fecha;
    }

    address public administrador;
    mapping(address => uint256) public saldo;
    mapping(address => Movimiento[]) private historial;
    uint256 public totalEnCaja;

    event Deposito(address cuenta, uint256 monto);
    event Retiro(address cuenta, uint256 monto);

    constructor() {
        administrador = msg.sender;
    }

    function depositar(uint256 monto) public {
        require(monto > 0, "Monto debe ser mayor a cero");

        saldo[msg.sender] += monto;
        totalEnCaja += monto;

        historial[msg.sender].push(Movimiento("deposito", monto, block.timestamp));
        emit Deposito(msg.sender, monto);
    }

    function retirar(uint256 monto) public {
        require(monto > 0, "Monto debe ser mayor a cero");
        require(saldo[msg.sender] >= monto, "Saldo insuficiente");

        saldo[msg.sender] -= monto;
        totalEnCaja -= monto;

        historial[msg.sender].push(Movimiento("retiro", monto, block.timestamp));
        emit Retiro(msg.sender, monto);
    }

    function obtenerHistorial(address cuenta)
        public view returns (Movimiento[] memory)
    {
        return historial[cuenta];
    }

    function contarMovimientos(address cuenta) public view returns (uint256) {
        return historial[cuenta].length;
    }

    function calcularPromedio(address cuenta) public view returns (uint256) {
        Movimiento[] memory movs = historial[cuenta];
        require(movs.length > 0, "Sin movimientos");

        uint256 suma = 0;
        for (uint256 i = 0; i < movs.length; i++) {
            suma += movs[i].monto;
        }
        return suma / movs.length;
    }
}
