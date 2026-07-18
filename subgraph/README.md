# Bagi subgraph

Indexes Bagi (Fuji) into a queryable API for the **leaderboard** (top tippers / top creators)
and **activity feed** — the cross-user views the dashboard can't get from single-address RPC
calls. Also mirrors the `HandleRegistry` so you can look up which wallet owns a handle.

## Sources (Fuji)

| Contract | Address | Event indexed |
|---|---|---|
| Bagi | `0xDea6Da93265871d828B20cace2BADd5F5e70209d` | `Tipped` |
| HandleRegistry | `0x481fE34ed995603abdB9998b7eCc8811e2707d87` | `Bound`, `Released` |

Split configs are **not** indexed — the dashboard reads `getSplit()` directly via RPC, so
there's nothing to gain from re-indexing the arrays.

## Build & deploy

```bash
cd subgraph
npm install
npm run codegen        # generates ./generated from schema + ABIs
npm run build          # graph build
npm run deploy         # goldsky subgraph deploy bagi/v1  (set your own slug + `goldsky login`)
```

`network: avalanche-fuji` in `subgraph.yaml`. For The Graph Studio instead of Goldsky, swap the
`deploy` script for `graph deploy --studio <name>`.

## Example queries

Top creators by USDC received:

```graphql
{ accounts(first: 10, orderBy: totalReceived, orderDirection: desc) {
    id totalReceived tipsReceived } }
```

Latest tips (activity feed):

```graphql
{ tips(first: 20, orderBy: timestamp, orderDirection: desc) {
    from { id } creator { id } amount fee memo timestamp txHash } }
```

Resolve a handle:

```graphql
{ handles(where: { platform: "twitter", username: "bagidemo" }) { wallet { id } boundAt } }
```
