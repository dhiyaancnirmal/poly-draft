// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {console2} from "../lib/console2.sol";
import {ScriptBase} from "./ScriptBase.sol";
import {Predix} from "../src/Predix.sol";
import {PredixManager} from "../src/PredixManager.sol";

/// @notice Deploy Predix token and manager. Expects:
/// - RPC URL via `FOUNDRY_ETH_RPC_URL` or `RPC_URL` in env
/// - Private key via `DEPLOYER_PRIVATE_KEY`
contract DeployPredix is ScriptBase {
    function run() public {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        vm.startBroadcast(deployerKey);

        Predix token = new Predix(deployer);
        PredixManager manager = new PredixManager(deployer, address(token));
        token.setManager(address(manager));

        vm.stopBroadcast();

        console2.log("Predix token", address(token));
        console2.log("Predix manager", address(manager));
        console2.log("Owner", deployer);
    }
}


