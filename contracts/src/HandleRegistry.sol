// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title HandleRegistry — bind a social handle to a wallet, so you can tip a name not a 0x…
/// @notice A wallet claims "platform:username" (e.g. "twitter:vitalik"); anyone can then
///         resolve that handle to the wallet and tip it through Bagi. This is what turns the
///         browser extension's "Tip this handle" button into an actual on-chain address.
/// @dev    First-come, self-serve binding. A handle maps to whoever claimed it; only that
///         wallet can rebind or release it, so nobody can hijack a claimed handle. The
///         owner can force-correct a handle (dispute / impersonation takedown).
///         ponytail: self-serve claim, no proof the wallet actually owns the account. nih's
///         tiered path (verifier-signed OAuth attestation) hardens this — add when
///         impersonation is an actual problem, not before. Owner override covers disputes
///         until then.
contract HandleRegistry {
    address public owner;

    // handleId => wallet that owns it
    mapping(bytes32 => address) public walletOf;

    event Bound(bytes32 indexed handleId, address indexed wallet, string platform, string username);
    event Released(bytes32 indexed handleId, address indexed wallet);

    error NotOwner();
    error Taken();
    error NotHolder();

    constructor() {
        owner = msg.sender;
    }

    /// @notice handleId = keccak256(platform || ":" || username). Same formula off-chain
    ///         (extension/dashboard/subgraph) so all sides agree on the key.
    function handleId(string memory platform, string memory username) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(platform, ":", username));
    }

    /// @notice Claim a handle for the caller. Reverts if another wallet already holds it.
    function bind(string calldata platform, string calldata username) external {
        bytes32 id = handleId(platform, username);
        address held = walletOf[id];
        if (held != address(0) && held != msg.sender) revert Taken();
        walletOf[id] = msg.sender;
        emit Bound(id, msg.sender, platform, username);
    }

    /// @notice Release a handle you hold, freeing it for someone else to claim.
    function unbind(string calldata platform, string calldata username) external {
        bytes32 id = handleId(platform, username);
        if (walletOf[id] != msg.sender) revert NotHolder();
        delete walletOf[id];
        emit Released(id, msg.sender);
    }

    /// @notice Resolve a handle to its wallet. address(0) => unclaimed.
    function resolve(string calldata platform, string calldata username) external view returns (address) {
        return walletOf[handleId(platform, username)];
    }

    /// @notice Owner dispute override: force a handle to a wallet, or to address(0) to clear.
    function adminBind(bytes32 id, address wallet) external {
        if (msg.sender != owner) revert NotOwner();
        walletOf[id] = wallet;
        emit Bound(id, wallet, "", "");
    }

    function transferOwnership(address to) external {
        if (msg.sender != owner) revert NotOwner();
        owner = to;
    }
}
