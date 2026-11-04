import { DOCS, OFFICIAL } from "../lib/api";
import { formatAgo } from "../lib/format";
import { useI18n, type Lang } from "../lib/i18n";
import { Chip } from "./ui";

export type FeedState = "online" | "stale" | "offline" | "unknown";

const STATE_KEY: Record<FeedState, string> = {
  online: "header.online",
  stale: "header.stale",
  offline: "header.offline",
  unknown: "header.connecting",
};

export function Header({
  state,
  updatedAt,
  onRefresh,
}: {
  state: FeedState;
  updatedAt: number | null;
  onRefresh: () => void;
}) {
  const { t, lang, setLang } = useI18n();
  const tone = state === "online" ? "green" : state === "stale" ? "gold" : state === "offline" ? "red" : "gray";

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
            <p className="brand-tag">{t("header.tag")}</p>
          </div>
        </div>
        <nav className="site-nav">
          <Chip tone={tone}>
            <span className={`pulse pulse-${tone}`} /> {t(STATE_KEY[state])}
          </Chip>
          <span className="nav-updated">
            {t("header.updated")} {updatedAt ? formatAgo(new Date(updatedAt).toISOString()) : "—"}
          </span>
          <button type="button" className="btn" onClick={onRefresh}>
            {t("header.refresh")}
          </button>
          <div className="lang-toggle" role="group" aria-label="language">
            {(["en", "zh"] as Lang[]).map((code) => (
              <button
                key={code}
                type="button"
                className={`lang-btn ${lang === code ? "lang-btn-active" : ""}`}
                onClick={() => setLang(code)}
              >
                {code === "en" ? "EN" : "中文"}
              </button>
            ))}
          </div>
          <a href={DOCS} target="_blank" rel="noopener noreferrer">
            {t("nav.docs")}
          </a>
          <a href={OFFICIAL} target="_blank" rel="noopener noreferrer">
            {t("nav.site")}
          </a>
        </nav>
      </div>
    </header>
  );
}
