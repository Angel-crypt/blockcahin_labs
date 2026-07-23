// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Cooperativa {

    struct Socio {
        string nombre;
        uint256 saldo;
        bool activo;
        uint256 fechaIngreso;
    }

    address public administrador;
    uint256 public cuotaIngreso;
    uint256 public totalSocios;
    uint256 public fondoComun;

    mapping(address => Socio) public socios;
    address[] private direccionesSocios;

    event NuevoSocio(address cuenta, string nombre);
    event DepositoRealizado(address cuenta, uint256 monto);
    event RetiroRealizado(address cuenta, uint256 monto);

    constructor(uint256 _cuota) {
        administrador = msg.sender;
        cuotaIngreso = _cuota;
    }

    function unirse(string memory nombre, uint256 aportacionInicial) public {
        require(!socios[msg.sender].activo, "Ya eres socio");
        require(aportacionInicial >= cuotaIngreso, "Aportacion insuficiente");
        require(bytes(nombre).length > 0, "Nombre requerido");

        socios[msg.sender] = Socio(nombre, aportacionInicial, true, block.timestamp);
        direccionesSocios.push(msg.sender);
        fondoComun += aportacionInicial;
        totalSocios++;

        emit NuevoSocio(msg.sender, nombre);
    }

    function depositar(uint256 monto) public {
        require(socios[msg.sender].activo, "No eres socio");
        require(monto > 0, "Monto invalido");

        socios[msg.sender].saldo += monto;
        fondoComun += monto;

        emit DepositoRealizado(msg.sender, monto);
    }

    function retirar(uint256 monto) public {
        require(socios[msg.sender].activo, "No eres socio");
        require(socios[msg.sender].saldo >= monto, "Saldo insuficiente");
        require(monto > 0, "Monto invalido");

        socios[msg.sender].saldo -= monto;
        fondoComun -= monto;

        emit RetiroRealizado(msg.sender, monto);
    }

    function consultarSocio(address cuenta)
        public view returns (string memory, uint256, bool, uint256)
    {
        Socio memory s = socios[cuenta];
        return (s.nombre, s.saldo, s.activo, s.fechaIngreso);
    }

    function socionConMayorSaldo() public view returns (address, uint256) {
        require(totalSocios > 0, "Sin socios registrados");

        address mejor = direccionesSocios[0];
        uint256 mayorSaldo = socios[mejor].saldo;

        for (uint256 i = 1; i < direccionesSocios.length; i++) {
            if (socios[direccionesSocios[i]].saldo > mayorSaldo) {
                mayorSaldo = socios[direccionesSocios[i]].saldo;
                mejor = direccionesSocios[i];
            }
        }
        return (mejor, mayorSaldo);
    }
}
