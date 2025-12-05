// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Predix} from "../src/Predix.sol";
import {TestHelper} from "./TestHelper.sol";

contract PredixTest is TestHelper {
    Predix internal token;
    address internal manager = address(0xABCD);
    address internal user = address(0xBEEF);

    function setUp() public {
        token = new Predix(manager);
    }

    function testMintAndBurnByManager() public {
        vm.prank(manager);
        token.mint(user, 10 ether);
        assertEq(token.totalSupply(), 10 ether, "supply after mint");
        assertEq(token.balanceOf(user), 10 ether, "balance after mint");

        vm.prank(manager);
        token.burn(user, 2 ether);
        assertEq(token.totalSupply(), 8 ether, "supply after burn");
        assertEq(token.balanceOf(user), 8 ether, "balance after burn");
    }

    function testMintFromNonManagerReverts() public {
        vm.expectRevert(Predix.NotManager.selector);
        token.mint(user, 1 ether);
    }

    function testTransferDisabled() public {
        vm.prank(manager);
        token.mint(user, 1 ether);

        vm.expectRevert(Predix.TransfersDisabled.selector);
        token.transfer(address(1), 1 ether);
    }

    function testApproveDisabled() public {
        vm.expectRevert(Predix.ApprovalsDisabled.selector);
        token.approve(address(1), 1 ether);
    }

    function testSetManager() public {
        address newManager = address(0xCAFE);
        vm.prank(manager);
        token.setManager(newManager);
        assertEq(token.manager(), newManager, "manager updated");

        vm.expectRevert(Predix.NotManager.selector);
        token.mint(user, 1);
    }
}


