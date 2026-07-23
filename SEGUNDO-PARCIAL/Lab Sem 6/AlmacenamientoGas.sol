// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AlmacenamientoGas {

    // Variable de estado: vive en Storage (persistente, costosa)
    uint256 public resultadoStorage;

    // Escribe el resultado en Storage
    function calcularEnStorage(uint256 a, uint256 b) public {
        resultadoStorage = a * b + a - b;
    }

    // Calcula en memoria y retorna sin escribir en Storage
    function calcularEnMemoria(uint256 a, uint256 b) public pure returns (uint256) {
        uint256 resultado = a * b + a - b;
        return resultado;
    }

    // Usa una variable local como acumulador sin guardarla
    function sumarRango(uint256 limite) public pure returns (uint256) {
        uint256 acumulador = 0;
        for (uint256 i = 1; i <= limite; i++) {
            acumulador += i;
        }
        return acumulador;
    }
}
