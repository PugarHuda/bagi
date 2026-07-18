// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title Bagi — trustless tip-splitter for Avalanche C-Chain
/// @notice A creator registers a split (recipients + basis-point shares). Anyone
///         tips USDC to that creator; the contract allocates each recipient's share
///         atomically. This is the thing TipeeeStream/StreamElements can't do:
///         the split is enforced by the contract, nobody has to trust a payout admin.
/// @dev    Single value token (native USDC on Avalanche) for the MVP. Pull-based
///         accounting: a tip credits balances, recipients withdraw. Pull avoids a
///         single reverting/malicious recipient bricking the tip path (griefing) and
///         keeps the tip call cheap regardless of recipient count.
contract Bagi {
    // ponytail: single token (native USDC) for MVP. Multi-token = mapping the token
    // into `earned` and `tip`, add when a second asset is actually requested.
    IERC20 public immutable usdc;

    uint16 public constant BPS = 10_000;
    uint16 public constant MAX_FEE_BPS = 100; // hard ceiling: protocol fee can never exceed 1%
    uint16 public constant MAX_RECIPIENTS = 20; // bounds withdraw-list gas + tip loop

    address public owner;
    address public feeRecipient;
    uint16 public feeBps; // protocol fee in basis points, <= MAX_FEE_BPS

    struct Split {
        address[] recipients;
        uint16[] bps; // parallel to recipients, must sum to BPS
    }

    // creator address => their split config
    mapping(address => Split) private _splits;
    // account => withdrawable USDC balance
    mapping(address => uint256) public earned;

    // lifetime stats (cheap on-chain leaderboard fuel, mirrors nih's HandleStat)
    mapping(address => uint256) public tippedIn; // total received routed through a creator's split
    mapping(address => uint256) public tippedOut; // total sent by a tipper

    uint256 private _lock = 1;

    event SplitSet(address indexed creator, address[] recipients, uint16[] bps);
    event Tipped(address indexed from, address indexed creator, uint256 amount, uint256 fee, string memo);
    event Withdrawn(address indexed account, uint256 amount);
    event FeeUpdated(uint16 feeBps, address feeRecipient);

    error NotOwner();
    error BadSplit();
    error NoSplit();
    error FeeTooHigh();
    error ZeroAmount();
    error Reentrant();
    error TransferFailed();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier nonReentrant() {
        if (_lock != 1) revert Reentrant();
        _lock = 2;
        _;
        _lock = 1;
    }

    constructor(address _usdc, address _feeRecipient, uint16 _feeBps) {
        if (_usdc == address(0) || _feeRecipient == address(0)) revert BadSplit();
        if (_feeBps > MAX_FEE_BPS) revert FeeTooHigh();
        usdc = IERC20(_usdc);
        owner = msg.sender;
        feeRecipient = _feeRecipient;
        feeBps = _feeBps;
    }

    /// @notice Register or update the caller's split. Shares must sum to exactly 10000.
    function setSplit(address[] calldata recipients, uint16[] calldata bps) external {
        uint256 n = recipients.length;
        if (n == 0 || n > MAX_RECIPIENTS || n != bps.length) revert BadSplit();
        uint256 sum;
        for (uint256 i; i < n; ++i) {
            if (recipients[i] == address(0) || bps[i] == 0) revert BadSplit();
            sum += bps[i];
        }
        if (sum != BPS) revert BadSplit();
        _splits[msg.sender] = Split(recipients, bps);
        emit SplitSet(msg.sender, recipients, bps);
    }

    /// @notice Tip a creator. Pulls `amount` USDC from the caller, takes the protocol
    ///         fee, and allocates the remainder across the creator's split recipients.
    function tip(address creator, uint256 amount, string calldata memo) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        Split storage s = _splits[creator];
        uint256 n = s.recipients.length;
        if (n == 0) revert NoSplit();

        _safeTransferFrom(msg.sender, address(this), amount);

        uint256 fee = (amount * feeBps) / BPS;
        if (fee != 0) earned[feeRecipient] += fee;
        uint256 net = amount - fee;

        // Allocate by bps; last recipient absorbs the rounding remainder so no dust is lost.
        uint256 distributed;
        for (uint256 i; i < n; ++i) {
            uint256 share = i == n - 1 ? net - distributed : (net * s.bps[i]) / BPS;
            distributed += share;
            earned[s.recipients[i]] += share;
        }

        tippedIn[creator] += net;
        tippedOut[msg.sender] += amount;
        emit Tipped(msg.sender, creator, amount, fee, memo);
    }

    /// @notice Withdraw your accumulated USDC (as a recipient of any split, or as feeRecipient).
    function withdraw() external nonReentrant {
        uint256 amount = earned[msg.sender];
        if (amount == 0) revert ZeroAmount();
        earned[msg.sender] = 0; // effects before interaction
        _safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function setFee(uint16 _feeBps, address _feeRecipient) external onlyOwner {
        if (_feeBps > MAX_FEE_BPS) revert FeeTooHigh();
        if (_feeRecipient == address(0)) revert BadSplit();
        feeBps = _feeBps;
        feeRecipient = _feeRecipient;
        emit FeeUpdated(_feeBps, _feeRecipient);
    }

    function transferOwnership(address to) external onlyOwner {
        if (to == address(0)) revert BadSplit();
        owner = to;
    }

    /// @notice Read a creator's split config (arrays returned together).
    function getSplit(address creator) external view returns (address[] memory, uint16[] memory) {
        Split storage s = _splits[creator];
        return (s.recipients, s.bps);
    }

    // --- minimal safe ERC20 (USDC returns bool; also tolerates no-return tokens) ---
    function _safeTransfer(address to, uint256 value) private {
        _call(abi.encodeWithSelector(IERC20.transfer.selector, to, value));
    }

    function _safeTransferFrom(address from, address to, uint256 value) private {
        _call(abi.encodeWithSelector(IERC20.transferFrom.selector, from, to, value));
    }

    function _call(bytes memory data) private {
        (bool ok, bytes memory ret) = address(usdc).call(data);
        if (!ok || (ret.length != 0 && !abi.decode(ret, (bool)))) revert TransferFailed();
    }
}

interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}
