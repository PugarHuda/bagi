import { useState } from "react";
import { BRAND, DASHBOARD_URL } from "~lib/config";

/**
 * Tip panel for the floating extension button.
 *
 * Tip-only (nih's subscribe/stream mode is dropped — Bagi has no
 * streaming contract). Preset buttons + a custom USDC amount.
 *
 * Content scripts run in Plasmo's ISOLATED world (no window.ethereum),
 * so we never sign inline — we deep-link the Bagi dashboard in a new tab
 * with query params and let it do the wallet work.
 *
 * Dashboard deep-link contract:
 *   ${dashboardUrl}/?platform=<p>&username=<u>&amount=<n>[&return=<url>]
 */
export type Platform = "twitter" | "youtube" | "github" | "linkedin";

export function TipPanel({
  username,
  platform,
  onClose,
  returnUrl,
  dashboardUrl = DASHBOARD_URL,
}: {
  username: string;
  platform: Platform;
  onClose: () => void;
  returnUrl?: string;
  dashboardUrl?: string;
}) {
  const [custom, setCustom] = useState("");

  function go(amount: number) {
    const params = new URLSearchParams({
      platform,
      username,
      amount: String(amount),
    });
    if (returnUrl) params.set("return", returnUrl);
    // Dashboard is a single static index.html → link to ROOT with query.
    window.open(`${dashboardUrl}/?${params.toString()}`, "_blank", "noopener,noreferrer");
    onClose();
  }

  return (
    <div
      style={{
        marginBottom: 8,
        background: "#FFFEF7",
        color: "#0A0A0A",
        border: "3px solid #0A0A0A",
        boxShadow: "4px 4px 0 0 #0A0A0A",
        padding: 12,
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
        width: 240,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 13 }}>
        Tip @{username}
      </div>
      <div style={{ fontSize: 10, color: "#666", marginBottom: 8 }}>
        platform: {platform} · split as USDC on Avalanche
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {[1, 5, 10, 25].map((p) => (
          <button key={p} onClick={() => go(p)} style={pillStyle}>
            {p} USDC
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <input
          type="number"
          min={0.5}
          step={0.5}
          placeholder="custom"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          style={{
            flex: 1,
            padding: "6px 8px",
            border: "2px solid #0A0A0A",
            fontFamily: "system-ui, sans-serif",
            fontSize: 13,
          }}
        />
        <button
          disabled={!Number(custom)}
          onClick={() => go(Number(custom))}
          style={{
            ...pillStyle,
            background: Number(custom) ? BRAND : "#E8E8E8",
            color: Number(custom) ? "#FFFFFF" : "#0A0A0A",
            cursor: Number(custom) ? "pointer" : "not-allowed",
          }}
        >
          Go
        </button>
      </div>
    </div>
  );
}

const pillStyle: React.CSSProperties = {
  padding: "6px 10px",
  background: BRAND,
  color: "#FFFFFF",
  border: "2px solid #0A0A0A",
  fontFamily: "system-ui, sans-serif",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};
