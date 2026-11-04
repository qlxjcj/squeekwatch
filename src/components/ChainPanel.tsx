import type { CoreResponse, EconomyStateResponse, MeasurementBlocksResponse } from "../lib/types";
import { formatCount, formatDuration, formatTime, toBig, toNum } from "../lib/format";
import { useI18n } from "../lib/i18n";
import { ProgressBar } from "./Charts";
import { Chip, Notice, Panel, Stat } from "./ui";

export function ChainPanel({
  core,
  blocks,
  economy,
}: {
  core: CoreResponse | null;
  blocks: MeasurementBlocksResponse | null;
  economy: EconomyStateResponse | null;
}) {
  const { t } = useI18n();
  const state = core?.core ?? null;
  const config = core?.configuration ?? null;
  const units = toBig(config?.blockUnitsPerBlock ?? 1_000_000_000) ?? 1_000_000_000n;
  const progress = toBig(state?.blockProgress ?? 0n) ?? 0n;
  const progressPct = Number((progress * 10_000n) / units) / 10_000;

  // Round timing, when the projection endpoint is available.
  let roundEndsIn: string | null = null;
  let currentRound: string | null = null;
  if (economy && blocks) {
    currentRound = formatCount(economy.lifecycle.currentRound);
    const genesis = toNum(blocks.roundSchedule.genesisTimestamp);
    const duration = toNum(blocks.roundSchedule.roundDurationSeconds);
    const round = toBig(economy.lifecycle.currentRound);
    if (genesis !== null && duration !== null && round !== null) {
      const endsAt = genesis + Number(round) * duration;
      roundEndsIn = formatDuration(endsAt - Math.floor(Date.now() / 1000));
    }
  }

  return (
    <Panel
      title={t("chain.title")}
      subtitle={t("chain.sub")}
      right={
        state ? <Chip tone={state.paused ? "red" : "green"}>{state.paused ? t("chain.paused") : t("chain.settling")}</Chip> : null
      }
    >
      {core?.reason ? (
        <Notice tone="warn">
          SqueekCore: {core.reason}
        </Notice>
      ) : null}

      <div className="stat-row">
        <Stat
          label={t("chain.height")}
          value={`#${formatCount(state?.blockHeight)}`}
          sub={blocks ? `${t("chain.projected")} #${formatCount(blocks.projected.blockHeight)}` : undefined}
          tone="gold"
        />
        <Stat
          label={t("chain.round")}
          value={currentRound ?? "—"}
          sub={roundEndsIn ? `${t("chain.nextRoundIn")} ${roundEndsIn}` : undefined}
        />
        <Stat
          label={t("chain.difficulty")}
          value={`${formatCount(state?.workPerThousandBlocks)} ${t("chain.per1k")}`}
          sub={t("chain.difficultySub")}
        />
        <Stat
          label={t("chain.settledWork")}
          value={`${formatCount(state?.cumulativeWork)} ${t("chain.units")}`}
          sub={`${t("chain.throughRound")} ${formatCount(state?.settledThroughRound)}`}
        />
        <Stat label={t("chain.cumulative")} value={formatCount(state?.cumulativeBlockUnits)} />
      </div>

      <div className="block-progress">
        <div className="block-progress-head">
          <span>
            {t("chain.block")} #{formatCount(state ? (toBig(state.blockHeight) ?? 0n) + 1n : null)} {t("chain.progress")}
          </span>
          <span className="mono">
            {formatCount(progress)} / {formatCount(units)} {t("chain.units")} · {(progressPct * 100).toFixed(1)}%
          </span>
        </div>
        <ProgressBar value={progressPct} tone="gold" height={12} />
      </div>

      <h3 className="sub-title">{t("chain.provisionalTitle")}</h3>
      {blocks && blocks.status === "available" && blocks.blocks.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("chain.th.height")}</th>
              <th>{t("chain.th.round")}</th>
              <th>{t("chain.th.threshold")}</th>
              <th>{t("chain.th.crossed")}</th>
            </tr>
          </thead>
          <tbody>
            {blocks.blocks.slice(0, 8).map((b) => (
              <tr key={b.height}>
                <td className="mono">#{formatCount(b.height)}</td>
                <td className="mono">{formatCount(b.roundId)}</td>
                <td className="mono">{formatCount(b.workThreshold)}</td>
                <td className="mono">{b.completingAt ? formatTime(b.completingAt) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="chart-empty">
          {blocks?.reason ? `${t("chain.noProvisional")} (${blocks.reason})` : t("chain.noProvisional")}
        </p>
      )}
      <p className="fine-print">{t("chain.provisionalNote")}</p>
    </Panel>
  );
}
