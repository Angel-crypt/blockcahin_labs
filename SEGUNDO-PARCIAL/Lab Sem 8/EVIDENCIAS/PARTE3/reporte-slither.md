**THIS CHECKLIST IS NOT COMPLETE**. Use `--show-ignored-findings` to show all the results.
Summary
 - [reentrancy-eth](#reentrancy-eth) (1 results) (High)
 - [reentrancy-benign](#reentrancy-benign) (1 results) (Low)
 - [reentrancy-events](#reentrancy-events) (1 results) (Low)
 - [solc-version](#solc-version) (1 results) (Informational)
 - [low-level-calls](#low-level-calls) (1 results) (Informational)
 - [unindexed-event-address](#unindexed-event-address) (2 results) (Informational)
 - [immutable-states](#immutable-states) (1 results) (Optimization)
## reentrancy-eth
Impact: High
Confidence: Medium
 - [ ] ID-0
Reentrancy in [BovedaVulnerable.retirar(uint256)](contracts/BovedaVulnerable.sol#L22-L35):
	External calls:
	- [(exito,None) = msg.sender.call{value: monto}()](contracts/BovedaVulnerable.sol#L27)
	State variables written after the call(s):
	- [saldos[msg.sender] -= monto](contracts/BovedaVulnerable.sol#L31)
	[BovedaVulnerable.saldos](contracts/BovedaVulnerable.sol#L7) can be used in cross function reentrancies:
	- [BovedaVulnerable.consultarSaldo(address)](contracts/BovedaVulnerable.sol#L37-L39)
	- [BovedaVulnerable.depositar()](contracts/BovedaVulnerable.sol#L13-L18)
	- [BovedaVulnerable.retirar(uint256)](contracts/BovedaVulnerable.sol#L22-L35)
	- [BovedaVulnerable.saldos](contracts/BovedaVulnerable.sol#L7)

contracts/BovedaVulnerable.sol#L22-L35


## reentrancy-benign
Impact: Low
Confidence: Medium
 - [ ] ID-1
Reentrancy in [BovedaVulnerable.retirar(uint256)](contracts/BovedaVulnerable.sol#L22-L35):
	External calls:
	- [(exito,None) = msg.sender.call{value: monto}()](contracts/BovedaVulnerable.sol#L27)
	State variables written after the call(s):
	- [totalFondos -= monto](contracts/BovedaVulnerable.sol#L32)

contracts/BovedaVulnerable.sol#L22-L35


## reentrancy-events
Impact: Low
Confidence: Medium
 - [ ] ID-2
Reentrancy in [BovedaVulnerable.retirar(uint256)](contracts/BovedaVulnerable.sol#L22-L35):
	External calls:
	- [(exito,None) = msg.sender.call{value: monto}()](contracts/BovedaVulnerable.sol#L27)
	Event emitted after the call(s):
	- [Retiro(msg.sender,monto)](contracts/BovedaVulnerable.sol#L34)

contracts/BovedaVulnerable.sol#L22-L35


## solc-version
Impact: Informational
Confidence: High
 - [ ] ID-3
Version constraint ^0.8.20 contains known severe issues (https://solidity.readthedocs.io/en/latest/bugs.html)
	- VerbatimInvalidDeduplication
	- FullInlinerNonExpressionSplitArgumentEvaluationOrder
	- MissingSideEffectsOnSelectorAccess.
It is used by:
	- [^0.8.20](contracts/BovedaVulnerable.sol#L2)
	- [^0.8.20](contracts/TokenVulnerable.sol#L2)

contracts/BovedaVulnerable.sol#L2


## low-level-calls
Impact: Informational
Confidence: High
 - [ ] ID-4
Low level call in [BovedaVulnerable.retirar(uint256)](contracts/BovedaVulnerable.sol#L22-L35):
	- [(exito,None) = msg.sender.call{value: monto}()](contracts/BovedaVulnerable.sol#L27)

contracts/BovedaVulnerable.sol#L22-L35


## unindexed-event-address
Impact: Informational
Confidence: High
 - [ ] ID-5
Event [BovedaVulnerable.Retiro(address,uint256)](contracts/BovedaVulnerable.sol#L11) has address parameters but no indexed parameters

contracts/BovedaVulnerable.sol#L11


 - [ ] ID-6
Event [BovedaVulnerable.Deposito(address,uint256)](contracts/BovedaVulnerable.sol#L10) has address parameters but no indexed parameters

contracts/BovedaVulnerable.sol#L10


## immutable-states
Impact: Optimization
Confidence: High
 - [ ] ID-7
[TokenVulnerable.owner](contracts/TokenVulnerable.sol#L11) should be immutable 

contracts/TokenVulnerable.sol#L11


