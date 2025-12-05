// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Vm} from "../lib/Vm.sol";

/// @notice Minimal base script exposing the Foundry VM cheatcodes.
abstract contract ScriptBase {
    Vm public constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
}


