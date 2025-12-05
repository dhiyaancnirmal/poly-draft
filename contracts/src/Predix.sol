// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title Predix Token
/// @notice Non-transferable ERC20-like token. Only the manager can mint/burn.
contract Predix {
    // --- Immutable metadata
    string public constant name = "Predix";
    string public constant symbol = "PREDIX";
    uint8 public constant decimals = 18;

    // --- Auth
    address public manager;

    // --- Storage
    mapping(address => uint256) public balanceOf;
    uint256 public totalSupply;

    // --- Events (ERC20-compatible surface)
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event ManagerUpdated(address indexed manager);

    // --- Errors
    error NotManager();
    error TransfersDisabled();
    error ApprovalsDisabled();
    error ManagerZero();

    constructor(address manager_) {
        if (manager_ == address(0)) revert ManagerZero();
        manager = manager_;
        emit ManagerUpdated(manager_);
    }

    function setManager(address newManager) external onlyManager {
        if (newManager == address(0)) revert ManagerZero();
        manager = newManager;
        emit ManagerUpdated(newManager);
    }

    // --- Manager actions
    function mint(address to, uint256 amount) external onlyManager {
        require(to != address(0), "mint to zero");
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function burn(address from, uint256 amount) external onlyManager {
        uint256 bal = balanceOf[from];
        require(bal >= amount, "insufficient");
        balanceOf[from] = bal - amount;
        totalSupply -= amount;
        emit Transfer(from, address(0), amount);
    }

    // --- Disabled ERC20 methods
    function transfer(address, uint256) external pure returns (bool) {
        revert TransfersDisabled();
    }

    function approve(address, uint256) external pure returns (bool) {
        revert ApprovalsDisabled();
    }

    function allowance(address, address) external pure returns (uint256) {
        return 0;
    }

    function transferFrom(address, address, uint256) external pure returns (bool) {
        revert TransfersDisabled();
    }

    // --- Modifiers
    modifier onlyManager() {
        if (msg.sender != manager) revert NotManager();
        _;
    }
}


