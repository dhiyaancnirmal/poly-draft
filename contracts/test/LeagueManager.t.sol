// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {LeagueManager} from "../src/LeagueManager.sol";
import {MockUSDC} from "./MockUSDC.sol";
import {TestHelper} from "./TestHelper.sol";

contract LeagueManagerTest is TestHelper {
    LeagueManager internal manager;
    MockUSDC internal usdc;

    address internal owner = address(0xAB);
    address internal player1 = address(0xCD);
    address internal player2 = address(0xEF);
    address internal player3 = address(0x11);

    bytes32 internal leagueId = bytes32("league-001");
    uint256 internal buyIn = 10 * 1e6; // 10 USDC (6 decimals)
    uint256 internal maxPlayers = 4;

    function setUp() public {
        usdc = new MockUSDC();
        manager = new LeagueManager(owner, address(usdc));

        // Mint USDC to players
        usdc.mint(player1, 100 * 1e6);
        usdc.mint(player2, 100 * 1e6);
        usdc.mint(player3, 100 * 1e6);
    }

    // --- Create League Tests ---

    function testCreateLeague() public {
        vm.prank(owner);
        manager.createLeague(leagueId, buyIn, maxPlayers);

        (uint256 _buyIn, uint256 pool, uint256 _maxPlayers, uint256 currentPlayers, LeagueManager.LeagueStatus status) =
            manager.getLeague(leagueId);

        assertEq(_buyIn, buyIn, "buyIn mismatch");
        assertEq(pool, 0, "pool should be 0");
        assertEq(_maxPlayers, maxPlayers, "maxPlayers mismatch");
        assertEq(currentPlayers, 0, "currentPlayers should be 0");
        assertEq(uint256(status), uint256(LeagueManager.LeagueStatus.Open), "status should be Open");
    }

    function testCreateLeagueOnlyOwner() public {
        vm.prank(player1);
        vm.expectRevert(LeagueManager.NotOwner.selector);
        manager.createLeague(leagueId, buyIn, maxPlayers);
    }

    function testCannotCreateDuplicateLeague() public {
        vm.prank(owner);
        manager.createLeague(leagueId, buyIn, maxPlayers);

        vm.prank(owner);
        vm.expectRevert(LeagueManager.LeagueExists.selector);
        manager.createLeague(leagueId, buyIn, maxPlayers);
    }

    function testCannotCreateWithZeroBuyIn() public {
        vm.prank(owner);
        vm.expectRevert(LeagueManager.InvalidBuyIn.selector);
        manager.createLeague(leagueId, 0, maxPlayers);
    }

    function testCannotCreateWithInvalidMaxPlayers() public {
        vm.prank(owner);
        vm.expectRevert(LeagueManager.InvalidMaxPlayers.selector);
        manager.createLeague(leagueId, buyIn, 1); // Too few

        vm.prank(owner);
        vm.expectRevert(LeagueManager.InvalidMaxPlayers.selector);
        manager.createLeague(leagueId, buyIn, 21); // Too many
    }

    // --- Join League Tests ---

    function testJoinLeague() public {
        vm.prank(owner);
        manager.createLeague(leagueId, buyIn, maxPlayers);

        // Player approves and joins
        vm.prank(player1);
        usdc.approve(address(manager), buyIn);

        vm.prank(player1);
        manager.joinLeague(leagueId);

        (,uint256 pool,, uint256 currentPlayers,) = manager.getLeague(leagueId);
        assertEq(pool, buyIn, "pool should equal buyIn");
        assertEq(currentPlayers, 1, "should have 1 player");
        assertEq(usdc.balanceOf(address(manager)), buyIn, "contract should hold buyIn");
    }

    function testMultiplePlayersJoin() public {
        vm.prank(owner);
        manager.createLeague(leagueId, buyIn, maxPlayers);

        // Player 1 joins
        vm.prank(player1);
        usdc.approve(address(manager), buyIn);
        vm.prank(player1);
        manager.joinLeague(leagueId);

        // Player 2 joins
        vm.prank(player2);
        usdc.approve(address(manager), buyIn);
        vm.prank(player2);
        manager.joinLeague(leagueId);

        (,uint256 pool,, uint256 currentPlayers,) = manager.getLeague(leagueId);
        assertEq(pool, buyIn * 2, "pool should be 2x buyIn");
        assertEq(currentPlayers, 2, "should have 2 players");
    }

    function testCannotJoinTwice() public {
        vm.prank(owner);
        manager.createLeague(leagueId, buyIn, maxPlayers);

        vm.prank(player1);
        usdc.approve(address(manager), buyIn * 2);
        vm.prank(player1);
        manager.joinLeague(leagueId);

        vm.prank(player1);
        vm.expectRevert(LeagueManager.AlreadyJoined.selector);
        manager.joinLeague(leagueId);
    }

    function testCannotJoinFullLeague() public {
        vm.prank(owner);
        manager.createLeague(leagueId, buyIn, 2); // Max 2 players

        vm.prank(player1);
        usdc.approve(address(manager), buyIn);
        vm.prank(player1);
        manager.joinLeague(leagueId);

        vm.prank(player2);
        usdc.approve(address(manager), buyIn);
        vm.prank(player2);
        manager.joinLeague(leagueId);

        // Player 3 tries to join full league
        vm.prank(player3);
        usdc.approve(address(manager), buyIn);
        vm.prank(player3);
        vm.expectRevert(LeagueManager.LeagueFull.selector);
        manager.joinLeague(leagueId);
    }

    // --- Activate League Tests ---

    function testActivateLeague() public {
        vm.prank(owner);
        manager.createLeague(leagueId, buyIn, maxPlayers);

        vm.prank(player1);
        usdc.approve(address(manager), buyIn);
        vm.prank(player1);
        manager.joinLeague(leagueId);

        vm.prank(owner);
        manager.activateLeague(leagueId);

        (,,,, LeagueManager.LeagueStatus status) = manager.getLeague(leagueId);
        assertEq(uint256(status), uint256(LeagueManager.LeagueStatus.Active), "status should be Active");
    }

    function testCannotJoinActiveLeague() public {
        vm.prank(owner);
        manager.createLeague(leagueId, buyIn, maxPlayers);

        vm.prank(player1);
        usdc.approve(address(manager), buyIn);
        vm.prank(player1);
        manager.joinLeague(leagueId);

        vm.prank(owner);
        manager.activateLeague(leagueId);

        vm.prank(player2);
        usdc.approve(address(manager), buyIn);
        vm.prank(player2);
        vm.expectRevert(LeagueManager.LeagueNotOpen.selector);
        manager.joinLeague(leagueId);
    }

    // --- Settle League Tests ---

    function testSettleLeague() public {
        vm.prank(owner);
        manager.createLeague(leagueId, buyIn, maxPlayers);

        // Both players join
        vm.prank(player1);
        usdc.approve(address(manager), buyIn);
        vm.prank(player1);
        manager.joinLeague(leagueId);

        vm.prank(player2);
        usdc.approve(address(manager), buyIn);
        vm.prank(player2);
        manager.joinLeague(leagueId);

        vm.prank(owner);
        manager.activateLeague(leagueId);

        // Record balances before
        uint256 p1Before = usdc.balanceOf(player1);
        uint256 p2Before = usdc.balanceOf(player2);

        // Settle: player1 wins 60%, player2 wins 40%
        address[] memory winners = new address[](2);
        winners[0] = player1;
        winners[1] = player2;

        uint256[] memory payouts = new uint256[](2);
        payouts[0] = 12 * 1e6; // 60% of 20 USDC
        payouts[1] = 8 * 1e6;  // 40% of 20 USDC

        vm.prank(owner);
        manager.settleLeague(leagueId, winners, payouts);

        // Check balances
        assertEq(usdc.balanceOf(player1), p1Before + 12 * 1e6, "player1 payout incorrect");
        assertEq(usdc.balanceOf(player2), p2Before + 8 * 1e6, "player2 payout incorrect");
        assertEq(usdc.balanceOf(address(manager)), 0, "contract should be empty");

        // Check status
        (,,,, LeagueManager.LeagueStatus status) = manager.getLeague(leagueId);
        assertEq(uint256(status), uint256(LeagueManager.LeagueStatus.Settled), "status should be Settled");
    }

    function testWinnerTakesAll() public {
        vm.prank(owner);
        manager.createLeague(leagueId, buyIn, maxPlayers);

        vm.prank(player1);
        usdc.approve(address(manager), buyIn);
        vm.prank(player1);
        manager.joinLeague(leagueId);

        vm.prank(player2);
        usdc.approve(address(manager), buyIn);
        vm.prank(player2);
        manager.joinLeague(leagueId);

        vm.prank(owner);
        manager.activateLeague(leagueId);

        uint256 p1Before = usdc.balanceOf(player1);

        // Player 1 takes all
        address[] memory winners = new address[](1);
        winners[0] = player1;

        uint256[] memory payouts = new uint256[](1);
        payouts[0] = 20 * 1e6; // Full pool

        vm.prank(owner);
        manager.settleLeague(leagueId, winners, payouts);

        assertEq(usdc.balanceOf(player1), p1Before + 20 * 1e6, "winner should get full pool");
    }

    function testCannotSettleWithWrongPayoutSum() public {
        vm.prank(owner);
        manager.createLeague(leagueId, buyIn, maxPlayers);

        vm.prank(player1);
        usdc.approve(address(manager), buyIn);
        vm.prank(player1);
        manager.joinLeague(leagueId);

        vm.prank(owner);
        manager.activateLeague(leagueId);

        address[] memory winners = new address[](1);
        winners[0] = player1;

        uint256[] memory payouts = new uint256[](1);
        payouts[0] = 5 * 1e6; // Wrong amount

        vm.prank(owner);
        vm.expectRevert(LeagueManager.InvalidPayouts.selector);
        manager.settleLeague(leagueId, winners, payouts);
    }

    // --- Cancel League Tests ---

    function testCancelLeague() public {
        vm.prank(owner);
        manager.createLeague(leagueId, buyIn, maxPlayers);

        vm.prank(player1);
        usdc.approve(address(manager), buyIn);
        vm.prank(player1);
        manager.joinLeague(leagueId);

        vm.prank(player2);
        usdc.approve(address(manager), buyIn);
        vm.prank(player2);
        manager.joinLeague(leagueId);

        uint256 p1Before = usdc.balanceOf(player1);
        uint256 p2Before = usdc.balanceOf(player2);

        vm.prank(owner);
        manager.cancelLeague(leagueId);

        // Both players should be refunded
        assertEq(usdc.balanceOf(player1), p1Before + buyIn, "player1 not refunded");
        assertEq(usdc.balanceOf(player2), p2Before + buyIn, "player2 not refunded");
        assertEq(usdc.balanceOf(address(manager)), 0, "contract should be empty");

        // Check status
        (,,,, LeagueManager.LeagueStatus status) = manager.getLeague(leagueId);
        assertEq(uint256(status), uint256(LeagueManager.LeagueStatus.Cancelled), "status should be Cancelled");
    }

    function testCancelActiveLeague() public {
        vm.prank(owner);
        manager.createLeague(leagueId, buyIn, maxPlayers);

        vm.prank(player1);
        usdc.approve(address(manager), buyIn);
        vm.prank(player1);
        manager.joinLeague(leagueId);

        vm.prank(owner);
        manager.activateLeague(leagueId);

        // Can still cancel active leagues
        vm.prank(owner);
        manager.cancelLeague(leagueId);

        (,,,, LeagueManager.LeagueStatus status) = manager.getLeague(leagueId);
        assertEq(uint256(status), uint256(LeagueManager.LeagueStatus.Cancelled), "should be cancelled");
    }

    // --- View Functions Tests ---

    function testGetParticipants() public {
        vm.prank(owner);
        manager.createLeague(leagueId, buyIn, maxPlayers);

        vm.prank(player1);
        usdc.approve(address(manager), buyIn);
        vm.prank(player1);
        manager.joinLeague(leagueId);

        vm.prank(player2);
        usdc.approve(address(manager), buyIn);
        vm.prank(player2);
        manager.joinLeague(leagueId);

        address[] memory participants = manager.getParticipants(leagueId);
        assertEq(participants.length, 2, "should have 2 participants");
        assertEq(participants[0], player1, "first participant");
        assertEq(participants[1], player2, "second participant");
    }

    function testIsParticipant() public {
        vm.prank(owner);
        manager.createLeague(leagueId, buyIn, maxPlayers);

        vm.prank(player1);
        usdc.approve(address(manager), buyIn);
        vm.prank(player1);
        manager.joinLeague(leagueId);

        require(manager.isParticipant(leagueId, player1) == true, "player1 should be participant");
        require(manager.isParticipant(leagueId, player2) == false, "player2 should not be participant");
    }
}

