// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RegistroSocios {

    address public administrador;
    bool public registroAbierto;
    uint256 public cuotaMinima;
    uint256 public totalSocios;

    mapping(address => bool) public esSocio;
    mapping(address => uint256) public aportacion;
    address[] public listaSocios;

    event SocioRegistrado(address socio, uint256 aportacion);
    event RegistroCerrado();

    constructor(uint256 _cuotaMinima) {
        administrador = msg.sender;
        cuotaMinima = _cuotaMinima;
        registroAbierto = true;
    }

    function registrarse(uint256 monto) public {
        require(registroAbierto, "El registro esta cerrado");
        require(!esSocio[msg.sender], "Ya eres socio");
        require(monto >= cuotaMinima, "Aportacion menor a la cuota minima");

        esSocio[msg.sender] = true;
        aportacion[msg.sender] = monto;
        listaSocios.push(msg.sender);
        totalSocios += 1;

        emit SocioRegistrado(msg.sender, monto);
    }

    function cerrarRegistro() public {
        require(msg.sender == administrador, "Solo el administrador");
        require(registroAbierto, "Ya esta cerrado");
        registroAbierto = false;
        emit RegistroCerrado();
    }

    function consultarSocio(address cuenta) public view returns (bool, uint256) {
        return (esSocio[cuenta], aportacion[cuenta]);
    }

    function obtenerTodos() public view returns (address[] memory) {
        return listaSocios;
    }
}
