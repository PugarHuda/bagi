# Bagi roadmap — the Avalanche-native upgrades

The MVP ships **C-Chain + native USDC only**. These two items are real Avalanche primitives
worth building *when there's demand*, not before. Written down so the grant reviewer sees the
intended path — and so nobody mistakes a design sketch for a shipped feature.

## ICTT — cross-L1 tips (skeleton only)

**Goal:** a tipper on another Avalanche L1 tips a creator whose split lives on C-Chain, in one
action, without manually bridging first.

**Shape:** `contracts/src/roadmap/BagiTeleporterReceiver.sol` is a compilable skeleton of the
receiver. A tipper's L1 sends USDC over an ICTT token bridge to this contract on C-Chain plus a
Teleporter message naming `(creator, amount, memo)`; the receiver calls `Bagi.tip` so the tip
lands in the on-chain split like any native tip.

**Why it's not built:** it needs (1) an ICTT `TokenHome`/`TokenRemote` pair deployed so USDC
actually moves between L1s, (2) a trusted `TeleporterMessenger` address, and (3) reconciling the
token-transfer leg with the message leg (they arrive as two separate events). That's real
multi-chain infra — out of scope for a single-chain MVP. The receiver `revert`s
`NotImplemented()` until it's wired. **Not deployed, not audited, not tested against live
Teleporter.**

## eERC — confidential splits (design note, no contract)

**Goal:** hide *individual* recipient shares while still proving the split sums to 100% and the
right total was paid. Useful when a team doesn't want each member's cut public on-chain.

**Shape:** replace the plaintext `earned[recipient]` balances with encrypted balances under
Avalanche's encrypted-ERC (eERC) standard; each `tip` posts a ZK proof that the ciphertext
deltas across recipients sum to the net tip. Recipients decrypt their own balance; observers see
only the total.

**Why there's no stub contract:** a fake `EncryptedSplit.sol` would be pure theater — the whole
feature *is* the ZK circuit + the eERC token integration, none of which a placeholder conveys.
This stays a written design until a creator actually asks for private shares.

## Handle-ownership verification (needs a backend)

**Goal:** stop impersonation — prove the wallet claiming `twitter:alice` actually controls that
account, instead of first-come self-serve.

**Shape:** nih's `verifiers/` pattern — the user posts a challenge string
`Verifying my Bagi wallet 0x…` on the profile they claim; a server fetches that public surface
(GitHub README, YouTube about, LinkedIn slug) and, on a match, signs a tiered attestation the
`HandleRegistry` accepts. The wallet address salts the challenge, so it can't be copied to a
victim's wallet.

**Why it's not built:** it needs a backend — a browser can't fetch twitter.com/github.com
directly (CORS), and the attestation must be signed by a trusted key. Bagi's dashboard is a
single static file with no server. Until then the registry is self-serve with an owner
`adminBind` override for disputes. **Add a serverless verifier when impersonation is an actual
problem, not before.**

---

*Reality check (from the grant strategy): Team1 Mini Grants are won on community traction and
founder presence, not infra sophistication. Bagi ships the smallest honest thing that works —
these upgrades wait for real demand.*
