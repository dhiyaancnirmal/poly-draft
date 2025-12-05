// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

/// @notice Minimal interface for Foundry cheatcodes used by scripts.
interface Vm {
    function envUint(string calldata) external returns (uint256);
    function envAddress(string calldata) external returns (address);
    function addr(uint256) external returns (address);
    function startBroadcast(uint256) external;
    function stopBroadcast() external;
    function prank(address) external;
    function expectRevert(bytes calldata) external;
    function expectRevert(bytes4) external;
    function expectEmit(bool, bool, bool, bool) external;
}


