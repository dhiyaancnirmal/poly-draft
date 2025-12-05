// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

/// @notice Minimal console for script logging (no-op at runtime).
library console2 {
    function log(string memory, address) internal pure {}
    function log(string memory, uint256) internal pure {}
}


