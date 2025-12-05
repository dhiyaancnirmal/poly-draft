// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Predix} from "./Predix.sol";

/// @title PredixManager
/// @notice Backend-owned controller that mints/burns Predix and emits transparency events.
contract PredixManager {
    // --- Immutable
    address public immutable owner;
    Predix public immutable predix;

    // --- Events
    event PickLogged(address indexed user, bytes32 indexed leagueId, bytes32 indexed marketId, bytes32 outcomeId);
    event SwapLogged(address indexed user, bytes32 indexed leagueId, bytes32 indexed marketId, bytes32 outcomeId);

    // --- Errors
    error NotOwner();

    constructor(address owner_, address predix_) {
        require(owner_ != address(0), "owner required");
        require(predix_ != address(0), "predix required");
        owner = owner_;
        predix = Predix(predix_);
    }

    // --- Owner controls
    function mint(address to, uint256 amount) external onlyOwner {
        predix.mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyOwner {
        predix.burn(from, amount);
    }

    function logPick(address user, bytes32 leagueId, bytes32 marketId, bytes32 outcomeId) external onlyOwner {
        emit PickLogged(user, leagueId, marketId, outcomeId);
    }

    function logSwap(address user, bytes32 leagueId, bytes32 marketId, bytes32 outcomeId) external onlyOwner {
        emit SwapLogged(user, leagueId, marketId, outcomeId);
    }

    // --- Modifiers
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }
}


