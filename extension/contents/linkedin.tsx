import type { PlasmoCSConfig } from "plasmo";
import { useEffect, useState } from "react";
import { Storage } from "@plasmohq/storage";
import { BRAND, DASHBOARD_URL } from "~lib/config";
import { TipPanel } from "~components/TipPanel";

const storage = new Storage({ area: "local" });

export const config: PlasmoCSConfig = {
  matches: ["https://www.linkedin.com/in/*", "https://www.linkedin.com/feed/*", "https://www.linkedin.com/posts/*"],
  run_at: "document_idle",
};

/**
 * LinkedIn content script.
 *
 * Floater appears on profile + post + feed pages.
 * Per-post injection: best-effort — LinkedIn rewrites its DOM
 * aggressively + ships anti-scraping. We target the stable
 * `[data-urn^="urn:li:activity:"]` containers, find the author's
 * profile link, and append a "Tip" pill.
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
      setUsername(extractLinkedInSlug(window.location.pathname));
      injectPerPostLinks(defaultTip, dashUrl);
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
          platform="linkedin"
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

function extractLinkedInSlug(pathname: string): string | null {
  const m = pathname.match(/^\/in\/([^/]+)/);
  if (m) return decodeURIComponent(m[1]);
  // Post URLs: /posts/{slug}_{activityId}
  const p = pathname.match(/^\/posts\/([^_/?]+)/);
  if (p) return decodeURIComponent(p[1]);
  return null;
}

function injectPerPostLinks(defaultTip = 5, dashUrl = DASHBOARD_URL) {
  // LinkedIn posts in the feed live in [data-urn^="urn:li:activity:"]
  const posts = document.querySelectorAll('[data-urn^="urn:li:activity:"]');
  posts.forEach((post) => {
    if (post.querySelector(`.${TIP_CLASS}`)) return;
    const authorLink = post.querySelector('a[href*="/in/"]') as HTMLAnchorElement | null;
    if (!authorLink) return;
    const m = authorLink.getAttribute("href")?.match(/\/in\/([^/?]+)/);
    if (!m) return;
    const handle = decodeURIComponent(m[1]);

    // Anchor: append to the post's social-actions bar (reactions / comment / repost).
    const actions = post.querySelector(".feed-shared-social-actions, .social-actions-bar");
    if (!actions) return;

    const a = document.createElement("a");
    a.className = TIP_CLASS;
    a.href = `${dashUrl}/?platform=linkedin&username=${encodeURIComponent(handle)}&amount=${defaultTip}&return=${encodeURIComponent(window.location.href)}`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.title = `Tip @${handle} ${defaultTip} USDC for this post`;
    a.textContent = `✦ Tip ${defaultTip} USDC`;
    Object.assign(a.style, {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 8px",
      marginLeft: "8px",
      background: BRAND,
      color: "#FFFFFF",
      border: "2px solid #0A0A0A",
      fontFamily: "system-ui, sans-serif",
      fontSize: "11px",
      fontWeight: "700",
      textDecoration: "none",
      verticalAlign: "middle",
    } as Partial<CSSStyleDeclaration>);
    actions.appendChild(a);
  });
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
