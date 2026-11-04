import type { CoreResponse, EconomyStateResponse, SettlementsResponse } from "../lib/types";
import { DOCS, OFFICIAL } from "../lib/api";
import { formatCompact, formatCount } from "../lib/format";
import { useI18n } from "../lib/i18n";

/** Decorative dot-matrix hamster wheel, drawn from nothing but circles. */
function WheelArt() {
  const dots = [];
  const rings = [
    { radius: 88, count: 36, size: 3.2, opacity: 0.9 },
    { radius: 70, count: 28, size: 2.6, opacity: 0.55 },
    { radius: 46, count: 18, size: 2.2, opacity: 0.4 },
  ];
  for (const ring of rings) {
    for (let i = 0; i < ring.count; i += 1) {
      const angle = (i / ring.count) * Math.PI * 2;
      dots.push(
        <circle
          key={`${ring.radius}-${i}`}
          cx={100 + Math.cos(angle) * ring.radius}
          cy={100 + Math.sin(angle) * ring.radius}
          r={ring.size}
          fill="var(--gold)"
          opacity={ring.opacity}
        />,
      );
    }
  }
  return (
    <svg className="hero-wheel" viewBox="0 0 200 200" aria-hidden="true">
      <circle cx="100" cy="100" r="96" fill="none" stroke="var(--line)" strokeWidth="1" />
      <g className="hero-wheel-spin">{dots}</g>
      {[0, 60, 120].map((deg) => (
        <line
          key={deg}
          x1={100 - Math.cos((deg * Math.PI) / 180) * 88}
          y1={100 - Math.sin((deg * Math.PI) / 180) * 88}
          x2={100 + Math.cos((deg * Math.PI) / 180) * 88}
          y2={100 + Math.sin((deg * Math.PI) / 180) * 88}
          stroke="var(--blue)"
          strokeWidth="1"
          opacity="0.35"
        />
      ))}
      <circle cx="100" cy="100" r="12" fill="var(--blue)" opacity="0.9" />
      <circle cx="100" cy="100" r="5" fill="var(--bg)" />
    </svg>
  );
}

export function Hero({
  core,
  economy,
  settlements,
}: {
  core: CoreResponse | null;
  economy: EconomyStateResponse | null;
  settlements: SettlementsResponse | null;
}) {
  const { t } = useI18n();
  const decimals = Number(economy?.asset.decimals ?? 18);
  const blocks24 = settlements?.summary?.completedBlockCount;

  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="hero-kicker">{t("hero.kicker")}</p>
        <h2 className="hero-title">
          {t("hero.title1")}
          <br />
          <span className="hero-title-accent">{t("hero.title2")}</span>
        </h2>
        <p className="hero-sub">{t("hero.sub")}</p>
        <div className="hero-actions">
          <a className="btn btn-primary" href={DOCS} target="_blank" rel="noopener noreferrer">
            {t("hero.cta.docs")}
          </a>
          <a className="btn" href={OFFICIAL} target="_blank" rel="noopener noreferrer">
            {t("hero.cta.genesis")}
          </a>
        </div>
      </div>
      <div className="hero-art">
        <WheelArt />
      </div>
      <div className="hero-stats">
        <div className="hero-stat">
          <span className="stat-label">{t("hero.stat.height")}</span>
          <span className="hero-stat-value">#{formatCount(core?.core.blockHeight)}</span>
        </div>
        <div className="hero-stat">
          <span className="stat-label">{t("hero.stat.round")}</span>
          <span className="hero-stat-value">{formatCount(economy?.lifecycle.currentRound)}</span>
        </div>
        <div className="hero-stat">
          <span className="stat-label">{t("hero.stat.supply")}</span>
          <span className="hero-stat-value">{formatCompact(economy?.supply.liveSupplyBaseUnits, decimals, 1)}</span>
        </div>
        <div className="hero-stat">
          <span className="stat-label">{t("hero.stat.blocks24")}</span>
          <span className="hero-stat-value">{formatCount(blocks24)}</span>
        </div>
      </div>
    </section>
  );
}
