// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Vm} from "../lib/Vm.sol";

/// @notice Minimal test helper without pulling forge-std.
contract TestHelper {
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function assertEq(uint256 a, uint256 b, string memory reason) internal pure {
        if (a != b) {
            revert(reason);
        }
    }

    function assertEq(address a, address b, string memory reason) internal pure {
        if (a != b) {
            revert(reason);
        }
    }
}


