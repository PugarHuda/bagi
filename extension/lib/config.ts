// Bagi extension config. Ported from the "nih" extension (Mezo) and
// re-pointed to Avalanche C-Chain. Origin: nih by the same author.

export const CHAIN = {
  id: 43113, // 0xa869
  name: "Avalanche Fuji",
  rpc: "https://api.avax-test.network/ext/bc/C/rpc",
  explorer: "https://testnet.snowtrace.io",
  nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
} as const;

export const ADDRESSES = {
  // Fuji native USDC (6 decimals) — the tip currency.
  USDC: (process.env.PLASMO_PUBLIC_USDC_ADDRESS ??
    "0x5425890298aed601595a70AB815c96711a31Bc65") as `0x${string}`,
  // Bagi splitter contract.
  Bagi: (process.env.PLASMO_PUBLIC_BAGI_ADDRESS ??
    "0xDea6Da93265871d828B20cace2BADd5F5e70209d") as `0x${string}`,
  // HandleRegistry.
  Registry: (process.env.PLASMO_PUBLIC_REGISTRY_ADDRESS ??
    "0x481fE34ed995603abdB9998b7eCc8811e2707d87") as `0x${string}`,
};

export const DASHBOARD_URL =
  process.env.PLASMO_PUBLIC_DASHBOARD_URL ??
  "https://dashboard-hudas-projects-a8e7f558.vercel.app";

export const TIP_PRESETS = [1, 5, 10, 25] as const;

// Brand accent — Bagi red (nih used yellow #FFD32D).
export const BRAND = "#e84142";
