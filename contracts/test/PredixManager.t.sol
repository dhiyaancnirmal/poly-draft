// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Predix} from "../src/Predix.sol";
import {PredixManager} from "../src/PredixManager.sol";
import {TestHelper} from "./TestHelper.sol";

contract PredixManagerTest is TestHelper {
    Predix internal token;
    PredixManager internal manager;
    address internal owner = address(0xAB);
    address internal user = address(0xCD);

    function setUp() public {
        token = new Predix(owner);
        manager = new PredixManager(owner, address(token));
        // hand over control to manager
        vm.prank(owner);
        token.setManager(address(manager));
    }

    function testMintBurnThroughManager() public {
        vm.prank(owner);
        manager.mint(user, 5 ether);
        assertEq(token.balanceOf(user), 5 ether, "minted balance");

        vm.prank(owner);
        manager.burn(user, 2 ether);
        assertEq(token.balanceOf(user), 3 ether, "burned balance");
    }

    function testOnlyOwnerProtected() public {
        vm.expectRevert(PredixManager.NotOwner.selector);
        manager.mint(user, 1);
    }

    function testLogPickEmits() public {
        vm.expectEmit(true, true, true, true);
        emit PredixManager.PickLogged(user, bytes32("league"), bytes32("market"), bytes32("outcome"));
        vm.prank(owner);
        manager.logPick(user, bytes32("league"), bytes32("market"), bytes32("outcome"));
    }

    function testLogSwapEmits() public {
        vm.expectEmit(true, true, true, true);
        emit PredixManager.SwapLogged(user, bytes32("league"), bytes32("market"), bytes32("outcome"));
        vm.prank(owner);
        manager.logSwap(user, bytes32("league"), bytes32("market"), bytes32("outcome"));
    }
}


