# Bagi — Team1 Mini Grant application (draft)

> Draft for the Avalanche **Team1 Mini Grant** (idea → MVP → first users, up to $10K).
> Everything below is already true and verifiable — contracts are live and verified on Fuji today.
>
> **Before submitting, fill the remaining `‹…›`:**
> - Traction: names of the first creator teams you'll onboard + target numbers (tips, USDC)
>
> Already filled: repo, live demo, contract addresses, builder + contact (@BangDropID),
> milestones, funding split ($3K/$4K/$3K = $10K).

---

## One-liner

**Bagi is a tip jar that splits itself.** A creator sets who gets what — team, mods,
collaborators, in basis points — and every USDC tip on Avalanche C-Chain routes to each share
automatically, enforced on-chain. No payout admin, nobody has to trust anyone to divide the
money fairly.

## The problem

Creator tipping tools (TipeeeStream, StreamElements) pay **one** account, then the split is
manual and trust-based: one person receives everything and is trusted to pay the others. Teams,
mod squads, and collab channels routinely get burned by this. There's no neutral referee.

## The solution

Bagi makes the split a property of the *address you tip*, not a promise someone makes later:

1. A creator calls `setSplit([recipients], [bps])` — shares in basis points, must sum to 100%.
2. Anyone calls `tip(creator, amount, memo)` — the contract pulls USDC, takes a ≤1% protocol
   fee, and credits each recipient their exact share (last recipient absorbs rounding, so no
   dust is ever lost).
3. Recipients `withdraw()` on their own schedule (pull-based — one malicious recipient can't
   brick anyone else's payout).

Tip by name, not by hex: a **HandleRegistry** lets a creator bind `twitter:theirname` to their
wallet, and a browser extension injects a "Split-tip USDC" button on their social profile that
resolves the handle and routes the tip through their split.

## Why Avalanche (honestly, which primitives)

| Primitive | Why it's load-bearing | Status |
|---|---|---|
| **C-Chain** | Low, predictable fees make micro-tips viable. The product dies on a chain where a $1 tip costs $1 to route. | ✅ live |
| **Native USDC** | Stable value, no bridge risk, no wrapped-token confusion for tippers. | ✅ live |
| **ICTT** | Receive tips from other Avalanche L1s into one C-Chain split. | 🗺 roadmap (honest skeleton, not faked) |
| **eERC** | Confidential splits — hide individual shares, prove the total. | 🗺 roadmap |

We deliberately shipped **only** C-Chain + USDC for the MVP. ICTT/eERC are real upgrades we'll
build when a second-L1 tipper or a privacy request actually shows up — not speculative
buzzword-chasing. (See `ROADMAP.md`.)

## What's already built (verifiable today)

- **Smart contracts, deployed + verified on Fuji, 18/18 tests passing:**
  - Bagi splitter — [`0xDea6Da93265871d828B20cace2BADd5F5e70209d`](https://testnet.snowtrace.io/address/0xDea6Da93265871d828B20cace2BADd5F5e70209d)
  - HandleRegistry — [`0x481fE34ed995603abdB9998b7eCc8811e2707d87`](https://testnet.snowtrace.io/address/0x481fE34ed995603abdB9998b7eCc8811e2707d87)
- **Dashboard** — a working web app: set a split, tip, withdraw, see stats + a supporter tier,
  claim your handle, and (via the subgraph) a live leaderboard + activity feed.
- **Browser extension** (Plasmo) — a "Split-tip USDC" button on Twitter/X, GitHub, YouTube, and
  LinkedIn profiles that deep-links to the dashboard with the creator's handle prefilled.
- **Subgraph** — indexes tips + handle bindings into a leaderboard, activity feed, and handle
  directory.

Repo: **https://github.com/PugarHuda/bagi** — contracts, dashboard, extension, and subgraph all in-tree.

## Why us

Bagi is the spiritual successor to [`nih`](https://github.com/PugarHuda/nih), a Bitcoin-backed
tipping app (extension + dashboard + contracts + subgraph) we already shipped on Mezo. We're not
learning the shape of this product on the grant's dime — we've built it once and are re-pointing
a proven architecture at Avalanche, with **auto-split** as the new core primitive.

- Builder: **@BangDropID** — shipped `nih` (Bitcoin-backed tipping on Mezo: extension + dashboard + contracts + subgraph), now building Bagi on Avalanche.
- GitHub: github.com/PugarHuda · X: [@BangDropID](https://x.com/BangDropID) · Telegram: lynx129 · Email: hudapugar@gmail.com

## Traction plan (the part that actually wins this grant)

We know Team1 Mini Grants go to community-driven projects with a visible founder, not to the
most sophisticated infra. So the plan is presence + real users, in parallel with shipping:

1. **Weeks 1–2:** ship mainnet C-Chain deploy; onboard ‹N› creator teams we already know
   (‹name the first few — collab channels, small streamer teams, DAO working groups›).
2. **Weeks 2–4:** daily-active presence in the Team1 Discord + build-in-public on X — one demo
   clip per feature (set a split, tip by handle from the extension, watch it route live).
3. **Weeks 4–6:** first ‹target› real tips routed through live splits; publish the leaderboard
   publicly as social proof.
4. Ongoing: office-hours with creator teams, iterate on the split UX from their feedback.

Success metric we'll report back on: **number of distinct splits created** and **total USDC
routed through them** — both are on-chain and independently verifiable.

## Funding ask & milestones ($10K)

| Milestone | Deliverable | Amount |
|---|---|---|
| M1 — Mainnet | Contracts deployed + verified on Avalanche C-Chain mainnet; dashboard pointed at mainnet USDC | $3,000 |
| M2 — First users | ‹N› creator teams onboarded; extension published to Chrome Web Store; first real tips routed | $4,000 |
| M3 — Traction | Public leaderboard live; ‹target› total USDC routed; build-in-public writeup + demo video | $3,000 |

Funds go to: audit/review of the two small contracts, Chrome Web Store + hosting, and creator
onboarding incentives (small tip-matching to bootstrap the first splits).

## Links

- Repo: https://github.com/PugarHuda/bagi
- Live dashboard demo: https://bagi-tips.vercel.app
- Contracts (verified on Snowtrace): see addresses above
- Prior work (nih): https://github.com/PugarHuda/nih
