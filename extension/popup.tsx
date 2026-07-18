import "~style.css";

import { useState, useEffect } from "react";
import { Storage } from "@plasmohq/storage";
import { DASHBOARD_URL, TIP_PRESETS } from "~lib/config";

const storage = new Storage({ area: "local" });

/**
 * Settings popup.
 *
 * The wallet lives on the Bagi dashboard, not here — content scripts
 * run in the ISOLATED world and just deep-link the dashboard, so the
 * popup is a plain settings page: default tip amount + dashboard URL.
 * Both are read back by the content scripts from chrome.storage.
 */
function IndexPopup() {
  const [defaultTip, setDefaultTip] = useState<number>(5);
  const [dashboardUrl, setDashboardUrl] = useState<string>(DASHBOARD_URL);

  useEffect(() => {
    (async () => {
      const savedTip = await storage.get<number>("defaultTip");
      if (savedTip) setDefaultTip(savedTip);
      const savedUrl = await storage.get<string>("dashboardUrl");
      if (savedUrl) setDashboardUrl(savedUrl);
    })();
  }, []);

  async function saveTip(v: number) {
    setDefaultTip(v);
    await storage.set("defaultTip", v);
  }

  async function saveUrl(v: string) {
    setDashboardUrl(v);
    await storage.set("dashboardUrl", v);
  }

  return (
    <div className="w-[340px] bg-bg text-fg font-sans">
      <div className="border-b border-border p-4 flex items-center gap-2">
        <div className="h-7 w-7 rounded-md bg-brand flex items-center justify-center text-white font-bold">
          B
        </div>
        <span className="font-semibold text-lg">Bagi</span>
        <span className="ml-auto text-[10px] uppercase tracking-wider text-muted">fuji</span>
      </div>

      <div className="p-4 space-y-4">
        <p className="text-sm text-muted">
          Split-tip USDC on any social profile. Trustless, one-click, on Avalanche.
        </p>

        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted mb-2">
            Default tip
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {TIP_PRESETS.map((amt) => (
              <button
                key={amt}
                onClick={() => saveTip(amt)}
                className={`h-9 rounded-md text-xs font-medium border transition ${
                  defaultTip === amt
                    ? "bg-brand text-white border-brand"
                    : "bg-surface border-border hover:border-brand/50"
                }`}
              >
                {amt}
              </button>
            ))}
          </div>
          {/* Custom amount — the per-page picker still overrides per tip. */}
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={defaultTip}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v > 0) saveTip(v);
              }}
              placeholder="custom"
              className="h-9 flex-1 rounded-md border border-border bg-surface px-3 text-xs"
              aria-label="Custom default tip amount"
            />
            <span className="text-[11px] text-muted">USDC</span>
          </div>
          <p className="text-[10px] text-muted mt-1.5">
            {TIP_PRESETS.includes(defaultTip as (typeof TIP_PRESETS)[number])
              ? "Or type any custom amount above."
              : `Custom default: ${defaultTip} USDC.`}
          </p>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted mb-2">
            Dashboard URL
          </p>
          <input
            type="url"
            value={dashboardUrl}
            onChange={(e) => saveUrl(e.target.value)}
            placeholder={DASHBOARD_URL}
            className="h-9 w-full rounded-md border border-border bg-surface px-3 text-xs font-mono"
            aria-label="Bagi dashboard URL"
          />
          <p className="text-[10px] text-muted mt-1.5">
            Where tip links open. Defaults to the built-in dashboard.
          </p>
        </div>

        <a
          href={dashboardUrl + "/"}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full h-10 leading-10 rounded-lg border border-border text-center text-sm font-medium hover:bg-surface"
        >
          Open dashboard ↗
        </a>
      </div>
    </div>
  );
}

export default IndexPopup;
