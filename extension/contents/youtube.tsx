import type { PlasmoCSConfig } from "plasmo";
import { useEffect, useState } from "react";
import { Storage } from "@plasmohq/storage";
import { BRAND, DASHBOARD_URL } from "~lib/config";
import { TipPanel } from "~components/TipPanel";

const storage = new Storage({ area: "local" });

export const config: PlasmoCSConfig = {
  matches: ["https://www.youtube.com/*"],
  run_at: "document_idle",
};

/**
 * YouTube content script.
 *
 * Floater (channel + custom amount) + per-video inline pill near the
 * like/share row. Per-video target is the channel owning the video; the
 * URL's v=<id> is passed as `context` so the dashboard/on-chain event
 * points back to the specific video.
 */

const TIP_CLASS = "bagi-tip-inline";

export default function BagiTipFloater() {
  const [username, setUsername] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [defaultTip, setDefaultTip] = useState(5);
  const [dashUrl, setDashUrl] = useState(DASHBOARD_URL);

  useEffect(() => {
    storage.get<number>("defaultTip").then((v) => { if (v && Number(v) > 0) setDefaultTip(Number(v)); });
    storage.get<string>("dashboardUrl").then((v) => { if (v) setDashUrl(v); });
    function update() {
      setUsername(extractYouTubeHandle());
      injectPerVideoLink(defaultTip, dashUrl);
    }
    update();
    const i = setInterval(update, 2000);
    return () => clearInterval(i);
  }, [defaultTip, dashUrl]);

  if (!username) return null;

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 2147483647 }}>
      {open && (
        <TipPanel
          username={username}
          platform="youtube"
          dashboardUrl={dashUrl}
          returnUrl={window.location.href}
          onClose={() => setOpen(false)}
        />
      )}
      <button onClick={() => setOpen((o) => !o)} style={floaterStyle}>
        <BagiLogo /> Tip @{username} · USDC
      </button>
    </div>
  );
}

function injectPerVideoLink(defaultTip = 5, dashUrl = DASHBOARD_URL) {
  // Only on watch pages (URL /watch?v=…)
  if (!window.location.pathname.startsWith("/watch")) return;
  if (document.querySelector(`.${TIP_CLASS}`)) return;
  const channelLink = document.querySelector(
    'ytd-video-owner-renderer a[href^="/@"]',
  ) as HTMLAnchorElement | null;
  if (!channelLink) return;
  const channel = channelLink.getAttribute("href")?.match(/^\/@([^/]+)/)?.[1];
  if (!channel) return;
  const videoId = new URLSearchParams(window.location.search).get("v") ?? "";

  // Anchor — the menu container next to like / share / save buttons.
  const anchor = document.querySelector(
    "ytd-watch-metadata #actions, ytd-menu-renderer.ytd-watch-metadata",
  );
  if (!anchor) return;

  const a = document.createElement("a");
  a.className = TIP_CLASS;
  const back = videoId
    ? `https://www.youtube.com/watch?v=${videoId}`
    : window.location.href;
  a.href = `${dashUrl}/?platform=youtube&username=${encodeURIComponent(channel)}&amount=${defaultTip}${
    videoId ? `&context=video:${videoId}` : ""
  }&return=${encodeURIComponent(back)}`;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.title = `Tip @${channel} ${defaultTip} USDC for this video`;
  a.textContent = `✦ Tip ${defaultTip} USDC`;
  Object.assign(a.style, {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 16px",
    marginLeft: "8px",
    background: BRAND,
    color: "#FFFFFF",
    border: "2px solid #0A0A0A",
    borderRadius: "20px",
    fontFamily: "Roboto, system-ui, sans-serif",
    fontSize: "13px",
    fontWeight: "700",
    textDecoration: "none",
    verticalAlign: "middle",
  } as Partial<CSSStyleDeclaration>);
  anchor.appendChild(a);
}

function extractYouTubeHandle(): string | null {
  const path = window.location.pathname;
  const at = path.match(/^\/@([^/]+)/);
  if (at) return at[1];
  const cName = path.match(/^\/c\/([^/]+)/);
  if (cName) return cName[1];
  const channelLink = document.querySelector(
    'ytd-channel-name a[href^="/@"], ytd-video-owner-renderer a[href^="/@"]',
  ) as HTMLAnchorElement | null;
  if (channelLink) {
    const href = channelLink.getAttribute("href") ?? "";
    const m = href.match(/^\/@([^/]+)/);
    if (m) return m[1];
  }
  return null;
}

const floaterStyle: React.CSSProperties = {
  background: BRAND,
  color: "#FFFFFF",
  border: "3px solid #0A0A0A",
  boxShadow: "4px 4px 0 0 #0A0A0A",
  padding: "10px 16px",
  fontFamily: "system-ui, sans-serif",
  fontSize: 14,
  fontWeight: 700,
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  gap: 8,
  cursor: "pointer",
};
function BagiLogo() {
  return (
    <span
      style={{
        display: "inline-flex",
        width: 22,
        height: 22,
        alignItems: "center",
        justifyContent: "center",
        background: "#0A0A0A",
        color: BRAND,
        fontFamily: "system-ui",
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      B
    </span>
  );
}
