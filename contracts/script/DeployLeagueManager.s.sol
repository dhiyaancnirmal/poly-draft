// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {console2} from "../lib/console2.sol";
import {ScriptBase} from "./ScriptBase.sol";
import {LeagueManager} from "../src/LeagueManager.sol";

/// @notice Deploy LeagueManager to Polygon. Expects:
/// - RPC URL via `POLYGON_RPC_URL` or `FOUNDRY_ETH_RPC_URL`
/// - Private key via `DEPLOYER_PRIVATE_KEY`
/// - USDC address via `USDC_POLYGON_ADDRESS`
contract DeployLeagueManager is ScriptBase {
    function run() public {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        address usdc = vm.envAddress("USDC_POLYGON_ADDRESS");

        console2.log("Deployer", deployer);
        console2.log("USDC address", usdc);

        vm.startBroadcast(deployerKey);

        LeagueManager manager = new LeagueManager(deployer, usdc);

        vm.stopBroadcast();

        console2.log("LeagueManager deployed at", address(manager));
        console2.log("Owner", deployer);
    }
}

