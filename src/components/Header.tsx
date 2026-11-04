import { DOCS, OFFICIAL } from "../lib/api";
import { formatAgo } from "../lib/format";
import { Chip, OutLink } from "./ui";

export type FeedState = "online" | "stale" | "offline" | "unknown";

export function Header({
  state,
  updatedAt,
  onRefresh,
}: {
  state: FeedState;
  updatedAt: number | null;
  onRefresh: () => void;
}) {
  const tone = state === "online" ? "green" : state === "stale" ? "gold" : state === "offline" ? "red" : "gray";
  const text =
    state === "online"
      ? "WHEEL LIVE"
      : state === "stale"
        ? "MEASUREMENT STALE"
        : state === "offline"
          ? "NO DATA"
          : "CONNECTING";

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <span className="brand-dot" />
            <span className="brand-dot" />
            <span className="brand-dot" />
            <span className="brand-dot" />
          </span>
          <div className="brand-text">
            <h1 className="brand-name">
              SQUEEK<span className="brand-accent">WATCH</span>
            </h1>
            <p className="brand-tag">Squeekchain live dashboard · hamster-powered PoW on Sepolia</p>
          </div>
        </div>
        <nav className="site-nav">
          <Chip tone={tone}>
            <span className={`pulse pulse-${tone}`} /> {text}
          </Chip>
          <span className="nav-updated">
            updated {updatedAt ? formatAgo(new Date(updatedAt).toISOString()) : "—"}
          </span>
          <button type="button" className="btn" onClick={onRefresh}>
            ↻ refresh
          </button>
          <OutLink href={DOCS}>docs</OutLink>
          <OutLink href={OFFICIAL}>squeekchain.com</OutLink>
        </nav>
      </div>
    </header>
  );
}
