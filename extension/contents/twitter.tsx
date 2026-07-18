import type { PlasmoCSConfig } from "plasmo";
import { useEffect, useState } from "react";
import { Storage } from "@plasmohq/storage";
import { BRAND, DASHBOARD_URL } from "~lib/config";
import { TipPanel } from "~components/TipPanel";

const storage = new Storage({ area: "local" });

export const config: PlasmoCSConfig = {
  matches: ["https://twitter.com/*", "https://x.com/*"],
  run_at: "document_idle",
};

/**
 * Twitter/X content script.
 *
 * Two-layer UX:
 *  1. Floating button bottom-right — always visible on any profile,
 *     opens a tiny amount-picker dropdown. Pick a preset or type custom →
 *     opens the Bagi dashboard in a new tab with prefilled params.
 *  2. Per-tweet inline "Tip" link — re-injected every ~1.5s onto each
 *     [data-testid="tweet"] in the timeline. Clicking it deep-links the
 *     dashboard with the tweet's author + the URL's tweet ID as `context`.
 *
 * Why "open new tab" instead of inline wallet: Plasmo content scripts
 * run in ISOLATED world — no access to window.ethereum. The dashboard
 * does all the wallet work.
 */

const TIP_CLASS = "bagi-tip-inline";

export default function BagiTipFloater() {
  const [username, setUsername] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [defaultTip, setDefaultTip] = useState(5);
  const [dashUrl, setDashUrl] = useState(DASHBOARD_URL);

  useEffect(() => {
    storage.get<number>("defaultTip").then((v) => {
      if (v && Number(v) > 0) setDefaultTip(Number(v));
    });
    storage.get<string>("dashboardUrl").then((v) => { if (v) setDashUrl(v); });
    function update() {
      setUsername(extractTwitterUsername(window.location.pathname));
      injectPerTweetLinks(defaultTip, dashUrl);
    }
    update();
    const i = setInterval(update, 1500);
    return () => clearInterval(i);
  }, [defaultTip, dashUrl]);

  if (!username) return null;

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 2147483647 }}>
      {open && (
        <TipPanel
          username={username}
          platform="twitter"
          dashboardUrl={dashUrl}
          returnUrl={window.location.href}
          onClose={() => setOpen(false)}
        />
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        title={`Tip @${username} USDC via Bagi`}
        style={floaterStyle}
      >
        <BagiLogo /> Tip @{username} · USDC
      </button>
    </div>
  );
}

function extractTwitterUsername(pathname: string): string | null {
  const skip = new Set([
    "home", "explore", "notifications", "messages", "search", "settings",
    "i", "compose", "logout", "login", "signup", "tos", "privacy",
  ]);
  const seg = pathname.split("/").filter(Boolean)[0];
  if (!seg || skip.has(seg)) return null;
  if (!/^[A-Za-z0-9_]{1,15}$/.test(seg)) return null;
  return seg;
}

/**
 * Per-tweet inline link injection. Re-runs every ~1.5s so it survives
 * Twitter's virtualised feed (tweets unmount + remount on scroll).
 * Idempotent: we tag each link with TIP_CLASS so we don't double-inject.
 */
function injectPerTweetLinks(defaultTip = 5, dashUrl = DASHBOARD_URL) {
  const tweets = document.querySelectorAll('article[data-testid="tweet"]');
  tweets.forEach((article) => {
    if (article.querySelector(`.${TIP_CLASS}`)) return; // already injected

    // Author username — robust: the User-Name container holds a /username link.
    const userLink = article.querySelector(
      'a[role="link"][href^="/"][tabindex="-1"]',
    ) as HTMLAnchorElement | null;
    const author = userLink?.getAttribute("href")?.split("/")[1] ?? "";
    if (!author || /^(home|explore|notifications|messages|i|compose)$/.test(author)) return;

    // Tweet ID — from a /status/<id> link inside the tweet.
    const statusLink = article.querySelector('a[href*="/status/"]') as HTMLAnchorElement | null;
    const tweetId = statusLink?.getAttribute("href")?.match(/\/status\/(\d+)/)?.[1] ?? "";

    // Anchor: place the link before the tweet's reply/retweet bar.
    const actionBar = article.querySelector('[role="group"]');
    if (!actionBar) return;

    const a = document.createElement("a");
    a.className = TIP_CLASS;
    // Return target: the tweet's own permalink if we have the id, else
    // the current timeline. Lets the dashboard show a "Back to this tweet"
    // CTA so the tipper lands right where they came from.
    const back = tweetId
      ? `https://x.com/${author}/status/${tweetId}`
      : window.location.href;
    a.href = `${dashUrl}/?platform=twitter&username=${encodeURIComponent(author)}&amount=${defaultTip}${
      tweetId ? `&context=tweet:${tweetId}` : ""
    }&return=${encodeURIComponent(back)}`;
    a.dataset.amount = String(defaultTip);
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.title = `Tip @${author} ${defaultTip} USDC for this tweet`;
    a.textContent = `✦ Tip ${defaultTip} USDC`;
    Object.assign(a.style, {
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      padding: "4px 8px",
      marginLeft: "12px",
      background: BRAND,
      color: "#FFFFFF",
      border: "2px solid #0A0A0A",
      fontFamily: "system-ui, sans-serif",
      fontSize: "12px",
      fontWeight: "700",
      textDecoration: "none",
      cursor: "pointer",
    } as Partial<CSSStyleDeclaration>);
    actionBar.appendChild(a);
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
