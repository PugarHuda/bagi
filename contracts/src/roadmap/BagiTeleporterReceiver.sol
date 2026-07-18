// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

// ⚠️ ROADMAP / NOT DEPLOYED — this is a design skeleton, not a shipped feature.
// It compiles and encodes the intended ICTT flow, but it has NOT been wired to a live
// Teleporter messenger or exercised across two Avalanche L1s. Do not treat it as audited
// or working. The MVP (Bagi.sol + HandleRegistry.sol) uses only C-Chain + native USDC.

import {Bagi} from "../Bagi.sol";

/// @dev Minimal shape of Avalanche's Teleporter receiver callback. The canonical interface
///      ships in the avalabs teleporter package; redeclared here so this skeleton compiles alone.
interface ITeleporterReceiver {
    function receiveTeleporterMessage(bytes32 sourceBlockchainID, address originSenderAddress, bytes calldata message)
        external;
}

/// @title BagiTeleporterReceiver — receive a cross-L1 tip and route it through a C-Chain split.
/// @notice The intended ICTT flow: a tipper on another Avalanche L1 sends USDC via an ICTT
///         token bridge to this contract on C-Chain, plus a Teleporter message naming the
///         creator + memo. This receiver then calls Bagi.tip so the tip lands in the creator's
///         on-chain split, exactly as a native C-Chain tip would.
/// @dev    WHY THIS IS ROADMAP, NOT MVP: making this real requires (1) deploying an ICTT
///         TokenHome/TokenRemote pair so USDC actually moves between L1s, (2) trusting a
///         specific TeleporterMessenger address, and (3) reconciling the token-transfer leg
///         with the message leg (they arrive as two events). None of that exists on a single
///         C-Chain MVP, and the grant strategy is community traction first — so this is left
///         as a documented skeleton. ponytail: build the real thing when a second L1 tipper
///         actually shows up, not before.
contract BagiTeleporterReceiver is ITeleporterReceiver {
    Bagi public immutable bagi;
    address public immutable teleporterMessenger; // only this address may deliver messages

    error NotTeleporter();
    error NotImplemented();

    constructor(Bagi _bagi, address _teleporterMessenger) {
        bagi = _bagi;
        teleporterMessenger = _teleporterMessenger;
    }

    /// @inheritdoc ITeleporterReceiver
    function receiveTeleporterMessage(
        bytes32,
        /*sourceBlockchainID*/
        address,
        /*originSenderAddress*/
        bytes calldata message
    )
        external
        view
    {
        if (msg.sender != teleporterMessenger) revert NotTeleporter();
        // Intended decode: (address creator, uint256 amount, string memo) = abi.decode(...)
        // then usdc.approve(bagi, amount); bagi.tip(creator, amount, memo);
        // Gated off until the ICTT token-transfer leg is wired — see contract-level note.
        message; // silence unused warning
        revert NotImplemented();
    }
}
