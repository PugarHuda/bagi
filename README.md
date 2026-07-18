# Bagi — split tips, trustlessly, on Avalanche

**Bagi** (Indonesian: *"split / share out"*) turns any social profile into a **tip jar that
splits itself.** A creator sets who gets what (team, mods, collaborators — in basis points);
anyone tips **USDC on Avalanche C-Chain**; the contract routes each share automatically. No
payout admin, nobody has to trust anyone to divide the money fairly.

> The thing TipeeeStream / StreamElements can't do: they pay one account and the split is
> manual + trust-based. Bagi enforces the split on-chain. *That* is why it belongs on-chain —
> not for the buzzword.

Spiritual successor to [`nih`](https://github.com/PugarHuda/nih) (Bitcoin-backed tipping on
Mezo). Same proven shape — **extension + dashboard + contracts + subgraph** — re-pointed at
Avalanche, with auto-split as the new core primitive.

## Why Avalanche (which primitives, honestly)

| Primitive | Used for | Status |
|---|---|---|
| **C-Chain** | Low, predictable fees → micro-tips are actually viable. The whole product dies on a chain where a $1 tip costs $1 to route. | ✅ built |
| **Native USDC** (Circle, C-Chain) | Stable value token, no bridge risk, no fork. | ✅ built |
| **ICTT** (Interchain Token Transfer) | Receive tips from other Avalanche L1s into one C-Chain split. | 🗺 roadmap |
| **eERC** (encrypted ERC) | Confidential splits — hide individual shares, prove the total. | 🗺 roadmap |

MVP deliberately uses **only C-Chain + USDC**. ICTT/eERC are real Avalanche-native upgrades
kept on the roadmap, not speculatively built. (`ponytail`: add when a second L1 or a privacy
ask actually shows up.)

**Live demo:** https://bagi-tips.vercel.app · **Repo:** https://github.com/PugarHuda/bagi

## Live on Fuji (deployed + verified)

| Contract | Address | Explorer |
|---|---|---|
| **Bagi** splitter | `0xDea6Da93265871d828B20cace2BADd5F5e70209d` | [Snowtrace](https://testnet.snowtrace.io/address/0xDea6Da93265871d828B20cace2BADd5F5e70209d) |
| **HandleRegistry** | `0x481fE34ed995603abdB9998b7eCc8811e2707d87` | [Snowtrace](https://testnet.snowtrace.io/address/0x481fE34ed995603abdB9998b7eCc8811e2707d87) |

## Repo layout (nih → Bagi)

| nih (Mezo)                     | Bagi (Avalanche)              | State |
|--------------------------------|-------------------------------|-------|
| `contracts/` NihRouter + Vault | `contracts/` **Bagi** splitter + **HandleRegistry** | ✅ 18/18 tests, deployed + verified |
| `dashboard/` Next.js           | `dashboard/index.html` — set-split · tip · withdraw · stats · **supporter tier** · claim-handle · **leaderboard + activity feed** · resolves extension deep-links | ✅ one static page, live contract |
| `extension/` Plasmo, 4 sites   | `extension/` Plasmo — "Split-tip USDC" button on twitter/github/youtube/linkedin | ✅ built (source; `plasmo build` to package) |
| `subgraph/` Goldsky            | `subgraph/` — indexes `Tipped` + `Bound/Released` → leaderboard, activity feed, handle directory | ✅ built (`graph build` + deploy to run) |

**Handle tipping:** a creator claims `platform:username` in `HandleRegistry` (dashboard §4);
the extension injects a tip button on their social profile that deep-links to the dashboard,
which resolves the handle → wallet → routes the tip through their Bagi split. Tip by name, not
by `0x…`.

## Contracts

`Bagi.sol` — the splitter:

- `setSplit(recipients, bps)` — creator registers a split (shares in basis points, must sum to 10000, ≤20 recipients).
- `tip(creator, amount, memo)` — pulls USDC, takes protocol fee (≤1%, default 0.5%), allocates net across the split. Last recipient absorbs rounding → no dust lost.
- `withdraw()` — pull-based payout (a reverting recipient can't brick anyone else's tips).
- Lifetime `tippedIn` / `tippedOut` stats → cheap on-chain leaderboard, same as nih's HandleStat.

`HandleRegistry.sol` — social handle → wallet:

- `bind(platform, username)` — caller claims a handle (first-come, self-serve; only the holder can rebind/release).
- `resolve(platform, username)` → wallet — what the extension/dashboard call to turn `@name` into a tip target.
- `adminBind(id, wallet)` — owner dispute override for impersonation takedowns.

Roadmap (ICTT cross-L1 tips, eERC confidential splits) lives in [`ROADMAP.md`](ROADMAP.md) and
`contracts/src/roadmap/` — **design skeletons, not shipped features**.

### Test

```bash
cd contracts
forge test        # 18/18 pass: Bagi split math + HandleRegistry claim/resolve/dispute
```

### Deploy (Fuji)

```bash
cd contracts
forge script script/Deploy.s.sol --rpc-url fuji --broadcast \
  --private-key $PRIVATE_KEY \
  --sig "run(address,address,uint16)" \
  0x5425890298aed601595a70AB815c96711a31Bc65 $FEE_RECIPIENT 50

# HandleRegistry (no constructor args)
forge create src/HandleRegistry.sol:HandleRegistry --rpc-url fuji --broadcast --private-key $PRIVATE_KEY
```

USDC: Fuji `0x5425890298aed601595a70AB815c96711a31Bc65` · Mainnet `0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E`

## License

MIT
