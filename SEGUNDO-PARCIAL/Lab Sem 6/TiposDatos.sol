// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TiposDatos {

    // Enteros sin signo
    uint8  public edadMaxima   = 255;
    uint256 public totalSocios = 0;

    // Entero con signo
    int256 public temperatura  = -15;

    // Booleano
    bool public aceptandoSocios = true;

    // Dirección
    address public administrador;

    // Cadena de texto
    string public nombreCooperativa = "Cooperativa Lab";

    // Bytes fijos
    bytes32 public codigoInterno = "COO-2025-MX";

    constructor() {
        administrador = msg.sender;
    }

    function cambiarEstado(bool estado) public {
        aceptandoSocios = estado;
    }

    function incrementarSocios() public {
        totalSocios += 1;
    }
}
