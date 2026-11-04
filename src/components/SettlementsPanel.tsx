import type { SettlementsResponse } from "../lib/types";
import { formatAgo, formatCompact, formatCount, formatUnits, toBig, toNum } from "../lib/format";
import { explorerTx } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { BarChart } from "./Charts";
import { Chip, Notice, Panel, Stat } from "./ui";

/** Bucket field names are loosely defined; coerce defensively. */
const asNum = (v: unknown): number | null => (typeof v === "string" || typeof v === "number" ? toNum(v) : null);
const asBig = (v: unknown): bigint | null => (typeof v === "string" || typeof v === "number" ? toBig(v) : null);

export function SettlementsPanel({ data }: { data: SettlementsResponse | null }) {
  const { t } = useI18n();
  const summary = data?.summary;
  const mining = data?.mining;

  const buckets = data?.buckets ?? [];
  const bars = buckets.map((row, i) => {
    const blocks = asNum(row.completedBlockCount) ?? 0;
    const sqk = asBig(row.sqkMintedBaseUnits);
    const start = typeof row.startAt === "string" ? row.startAt : typeof row.startedAt === "string" ? row.startedAt : null;
    const label = start ? new Date(start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : `${i}`;
    return {
      key: `${i}-${label}`,
      label,
      value: blocks,
      title: `${label} · ${blocks} blocks${sqk !== null ? ` · ${formatUnits(sqk, 18, 2)} SQK` : ""}`,
    };
  });

  return (
    <Panel
      title={t("set.title")}
      subtitle={t("set.sub")}
      right={
        mining ? (
          <Chip tone={mining.status === "available" ? "green" : "gold"}>
            {mining.status === "available"
              ? `${t("set.mined")} ${formatCompact(mining.miningMintedBaseUnits, 18, 1)} SQK`
              : t("set.issuanceUnavailable")}
          </Chip>
        ) : null
      }
    >
      {data?.reason ? (
        <Notice tone="warn">
          {t("set.title")}: {data.reason}
        </Notice>
      ) : null}

      <div className="stat-row">
        <Stat label={t("set.count")} value={formatCount(summary?.settlementCount)} sub={t("set.batches")} />
        <Stat label={t("set.blocksDone")} value={formatCount(summary?.completedBlockCount)} tone="gold" />
        <Stat label={t("set.workAdded")} value={formatCount(summary?.workAdded)} sub={t("chain.units")} />
        <Stat label={t("set.activeRounds")} value={formatCount(summary?.activeRoundCount)} />
        <Stat
          label={t("set.issued")}
          value={mining?.rangeMintedBaseUnits !== undefined ? `${formatCompact(mining.rangeMintedBaseUnits, 18, 2)} SQK` : "—"}
          sub={mining?.rangeCheckpointCount !== undefined ? `${formatCount(mining.rangeCheckpointCount)} ${t("set.checkpoints")}` : undefined}
        />
      </div>

      <h3 className="sub-title">{t("set.perHour")}</h3>
      <BarChart bars={bars} color="var(--gold)" height={130} emptyText={t("set.noActivity")} />

      {mining?.nextRound ? (
        <p className="fine-print">
          {t("set.nextRound")} {formatCount(mining.nextRound.round)}{" "}
          <Chip tone={mining.nextRound.state === "ready" ? "green" : "blue"}>
            {mining.nextRound.state === "ready" ? t("set.state.ready") : t("set.state.accruing")}
          </Chip>{" "}
          · {formatCount(mining.nextRound.completedBlockCount)} {t("set.blocksSoFar")} ·{" "}
          {formatCompact(mining.nextRound.amountBaseUnits, 18, 2)} {t("set.sqkProjected")} · {t("set.fundedThrough")}{" "}
          {formatCount(mining.processedThroughRound)}
        </p>
      ) : null}

      <h3 className="sub-title">{t("set.recent")}</h3>
      {data && data.recentSettlements.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("set.th.rounds")}</th>
              <th>{t("set.th.blocks")}</th>
              <th>{t("set.th.work")}</th>
              <th>{t("set.th.sqk")}</th>
              <th>{t("set.th.when")}</th>
              <th>{t("set.th.tx")}</th>
            </tr>
          </thead>
          <tbody>
            {data.recentSettlements.slice(0, 8).map((row, i) => (
              <tr key={`${row.transactionHash}-${i}`}>
                <td className="mono">
                  #{formatCount(row.previousSettledThroughRound)} → #{formatCount(row.settledThroughRound)}
                </td>
                <td className="mono">
                  {formatCount(row.completedBlockCount)}{" "}
                  <span className="muted">
                    (#{formatCount(row.firstCompletedBlock)}–#{formatCount(row.lastCompletedBlock)})
                  </span>
                </td>
                <td className="mono">{formatCount(row.workAdded)}</td>
                <td className="mono">
                  {row.sqkMintedBaseUnits !== undefined && row.sqkMintedBaseUnits !== null
                    ? formatCompact(row.sqkMintedBaseUnits, 18, 2)
                    : t("set.pending")}
                </td>
                <td className="mono">{formatAgo(row.blockTimestamp)}</td>
                <td>
                  <a href={explorerTx(row.transactionHash)} target="_blank" rel="noopener noreferrer" className="mono">
                    {row.transactionHash.slice(0, 10)}…
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="chart-empty">{t("set.noSettlements")}</p>
      )}
    </Panel>
  );
}
