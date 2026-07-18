# Deploy runbook

The steps that need **your** login (I can't authenticate as you). Everything is verified up to
the auth wall: contracts are live+verified on Fuji, and the subgraph compiles
(`npm run codegen && npm run build` both pass).

## 1. Subgraph → Goldsky

```bash
cd subgraph
npm install                 # already done locally
npm run codegen             # ✅ passes
npm run build               # ✅ passes → build/subgraph.yaml

# auth (one-time): get a key at app.goldsky.com → Settings → API keys
goldsky login               # paste key

# deploy (the package.json script uses slug bagi/v1 — rename if you like)
npm run deploy              # == goldsky subgraph deploy bagi/v1
```

Goldsky prints a GraphQL endpoint. Turn on the dashboard's leaderboard + activity feed with it:

```js
// in the dashboard page's browser console:
localStorage.setItem('bagi_subgraph', 'https://api.goldsky.com/api/public/…/bagi/v1/gn')
```

*Alternative — The Graph Studio:* swap the deploy script for
`graph deploy --studio bagi` after `graph auth <deploy-key>`.

## 2. Host the dashboard (gives reviewers a clickable demo)

It's a single static file (`dashboard/index.html`) — any static host works. Laziest:

```bash
cd dashboard
npx vercel deploy --prod          # or: npx netlify deploy --prod --dir .
```

Or GitHub Pages: push the repo, Settings → Pages → serve from `/dashboard`.

Then point the extension at it:

```bash
cd extension
echo 'PLASMO_PUBLIC_DASHBOARD_URL=https://your-dashboard-url' > .env
npm install && npm run build      # produces build/chrome-mv3-prod → load unpacked in chrome://extensions
```

## 3. Mainnet contracts (grant milestone M1)

Same commands as Fuji, `--rpc-url avalanche`, and mainnet USDC. Fund the deployer with real AVAX
first.

```bash
cd contracts
# Bagi
forge script script/Deploy.s.sol --rpc-url avalanche --broadcast --private-key $KEY \
  --sig "run(address,address,uint16)" \
  0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E $FEE_RECIPIENT 50
# HandleRegistry
forge create src/HandleRegistry.sol:HandleRegistry --rpc-url avalanche --broadcast --private-key $KEY
```

Then update `BAGI_ADDR`/`REGISTRY_ADDR` in `dashboard/index.html`, the extension `.env`, and the
subgraph `subgraph.yaml` (addresses + `network: avalanche` + new `startBlock`), and redeploy the
subgraph.
