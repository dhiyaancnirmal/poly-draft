// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "./interfaces/IERC20.sol";

/// @title LeagueManager
/// @notice USDC escrow contract for paid fantasy leagues on Polygon.
/// @dev Owner-controlled; backend calls via private key for league lifecycle.
contract LeagueManager {
    // --- Types
    enum LeagueStatus {
        Open,
        Active,
        Settled,
        Cancelled
    }

    struct League {
        bytes32 id;
        uint256 buyIn;
        uint256 maxPlayers;
        uint256 pool;
        LeagueStatus status;
        address[] participants;
    }

    // --- Immutable
    address public immutable owner;
    IERC20 public immutable usdc;

    // --- Storage
    mapping(bytes32 => League) public leagues;
    mapping(bytes32 => mapping(address => bool)) public hasJoined;

    // --- Events
    event LeagueCreated(bytes32 indexed leagueId, uint256 buyIn, uint256 maxPlayers);
    event PlayerJoined(bytes32 indexed leagueId, address indexed player, uint256 poolTotal);
    event LeagueActivated(bytes32 indexed leagueId);
    event LeagueSettled(bytes32 indexed leagueId, address[] winners, uint256[] payouts);
    event LeagueCancelled(bytes32 indexed leagueId, uint256 refundPerPlayer);

    // --- Errors
    error NotOwner();
    error LeagueExists();
    error LeagueNotFound();
    error LeagueNotOpen();
    error LeagueNotActive();
    error LeagueFull();
    error AlreadyJoined();
    error InvalidBuyIn();
    error InvalidMaxPlayers();
    error InvalidPayouts();
    error TransferFailed();

    constructor(address owner_, address usdc_) {
        require(owner_ != address(0), "owner required");
        require(usdc_ != address(0), "usdc required");
        owner = owner_;
        usdc = IERC20(usdc_);
    }

    // --- League Lifecycle

    /// @notice Create a new paid league
    /// @param leagueId Unique identifier for the league (from backend)
    /// @param buyIn USDC amount required to join (in smallest units, e.g., 6 decimals)
    /// @param maxPlayers Maximum number of participants
    function createLeague(bytes32 leagueId, uint256 buyIn, uint256 maxPlayers) external onlyOwner {
        if (leagues[leagueId].id != bytes32(0)) revert LeagueExists();
        if (buyIn == 0) revert InvalidBuyIn();
        if (maxPlayers < 2 || maxPlayers > 20) revert InvalidMaxPlayers();

        leagues[leagueId] = League({
            id: leagueId,
            buyIn: buyIn,
            maxPlayers: maxPlayers,
            pool: 0,
            status: LeagueStatus.Open,
            participants: new address[](0)
        });

        emit LeagueCreated(leagueId, buyIn, maxPlayers);
    }

    /// @notice Join a league by transferring buy-in USDC
    /// @param leagueId The league to join
    /// @dev Caller must have approved this contract for buyIn amount
    function joinLeague(bytes32 leagueId) external {
        League storage league = leagues[leagueId];
        if (league.id == bytes32(0)) revert LeagueNotFound();
        if (league.status != LeagueStatus.Open) revert LeagueNotOpen();
        if (league.participants.length >= league.maxPlayers) revert LeagueFull();
        if (hasJoined[leagueId][msg.sender]) revert AlreadyJoined();

        // Transfer USDC from player to this contract
        bool success = usdc.transferFrom(msg.sender, address(this), league.buyIn);
        if (!success) revert TransferFailed();

        league.participants.push(msg.sender);
        league.pool += league.buyIn;
        hasJoined[leagueId][msg.sender] = true;

        emit PlayerJoined(leagueId, msg.sender, league.pool);
    }

    /// @notice Activate a league (close joining, start gameplay)
    /// @param leagueId The league to activate
    function activateLeague(bytes32 leagueId) external onlyOwner {
        League storage league = leagues[leagueId];
        if (league.id == bytes32(0)) revert LeagueNotFound();
        if (league.status != LeagueStatus.Open) revert LeagueNotOpen();

        league.status = LeagueStatus.Active;
        emit LeagueActivated(leagueId);
    }

    /// @notice Settle a league and distribute payouts to winners
    /// @param leagueId The league to settle
    /// @param winners Array of winner addresses
    /// @param payouts Array of payout amounts (must sum to pool)
    function settleLeague(
        bytes32 leagueId,
        address[] calldata winners,
        uint256[] calldata payouts
    ) external onlyOwner {
        League storage league = leagues[leagueId];
        if (league.id == bytes32(0)) revert LeagueNotFound();
        if (league.status != LeagueStatus.Active) revert LeagueNotActive();
        if (winners.length != payouts.length) revert InvalidPayouts();

        // Validate payouts sum to pool
        uint256 totalPayout = 0;
        for (uint256 i = 0; i < payouts.length; i++) {
            totalPayout += payouts[i];
        }
        if (totalPayout != league.pool) revert InvalidPayouts();

        // Distribute payouts
        for (uint256 i = 0; i < winners.length; i++) {
            if (payouts[i] > 0) {
                bool success = usdc.transfer(winners[i], payouts[i]);
                if (!success) revert TransferFailed();
            }
        }

        league.status = LeagueStatus.Settled;
        league.pool = 0;

        emit LeagueSettled(leagueId, winners, payouts);
    }

    /// @notice Cancel a league and refund all participants
    /// @param leagueId The league to cancel
    function cancelLeague(bytes32 leagueId) external onlyOwner {
        League storage league = leagues[leagueId];
        if (league.id == bytes32(0)) revert LeagueNotFound();
        if (league.status == LeagueStatus.Settled || league.status == LeagueStatus.Cancelled) {
            revert LeagueNotOpen(); // Can't cancel already finalized leagues
        }

        uint256 refundAmount = league.buyIn;
        address[] memory participants = league.participants;

        // Refund all participants
        for (uint256 i = 0; i < participants.length; i++) {
            bool success = usdc.transfer(participants[i], refundAmount);
            if (!success) revert TransferFailed();
        }

        league.status = LeagueStatus.Cancelled;
        league.pool = 0;

        emit LeagueCancelled(leagueId, refundAmount);
    }

    // --- View Functions

    /// @notice Get league details
    /// @param leagueId The league to query
    /// @return buyIn The buy-in amount
    /// @return pool Current pool balance
    /// @return maxPlayers Maximum participants
    /// @return currentPlayers Current participant count
    /// @return status League status
    function getLeague(bytes32 leagueId)
        external
        view
        returns (
            uint256 buyIn,
            uint256 pool,
            uint256 maxPlayers,
            uint256 currentPlayers,
            LeagueStatus status
        )
    {
        League storage league = leagues[leagueId];
        return (
            league.buyIn,
            league.pool,
            league.maxPlayers,
            league.participants.length,
            league.status
        );
    }

    /// @notice Get all participants in a league
    /// @param leagueId The league to query
    /// @return participants Array of participant addresses
    function getParticipants(bytes32 leagueId) external view returns (address[] memory) {
        return leagues[leagueId].participants;
    }

    /// @notice Check if an address has joined a league
    /// @param leagueId The league to check
    /// @param player The address to check
    /// @return joined Whether the player has joined
    function isParticipant(bytes32 leagueId, address player) external view returns (bool) {
        return hasJoined[leagueId][player];
    }

    // --- Modifiers

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }
}

