import type { SettlementsResponse } from "../lib/types";
import { formatAgo, formatCompact, formatCount, formatUnits, toBig, toNum } from "../lib/format";
import { explorerTx } from "../lib/api";
import { BarChart } from "./Charts";
import { Chip, Notice, Panel, Stat } from "./ui";

/** Bucket field names are loosely defined; coerce defensively. */
const asNum = (v: unknown): number | null => (typeof v === "string" || typeof v === "number" ? toNum(v) : null);
const asBig = (v: unknown): bigint | null => (typeof v === "string" || typeof v === "number" ? toBig(v) : null);

export function SettlementsPanel({ data }: { data: SettlementsResponse | null }) {
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
      title: `${label} · ${blocks} Squeek blocks${sqk !== null ? ` · ${formatUnits(sqk, 18, 2)} SQK` : ""}`,
    };
  });

  return (
    <Panel
      title="Settlements & SQK issuance · last 24h"
      subtitle="Rounds settle in batches; SQK is issued later, per round, at checkpoints"
      right={
        mining ? (
          <Chip tone={mining.status === "available" ? "green" : "gold"}>
            {mining.status === "available" ? `mined ${formatCompact(mining.miningMintedBaseUnits, 18, 1)} SQK` : "issuance data unavailable"}
          </Chip>
        ) : null
      }
    >
      {data?.reason ? <Notice tone="warn">Settlement history unavailable: {data.reason}</Notice> : null}

      <div className="stat-row">
        <Stat label="Settlements" value={formatCount(summary?.settlementCount)} sub="batches in window" />
        <Stat label="Squeek blocks completed" value={formatCount(summary?.completedBlockCount)} tone="gold" />
        <Stat label="Work added" value={formatCount(summary?.workAdded)} sub="work units" />
        <Stat label="Active rounds" value={formatCount(summary?.activeRoundCount)} />
        <Stat
          label="SQK issued (window)"
          value={mining?.rangeMintedBaseUnits !== undefined ? `${formatCompact(mining.rangeMintedBaseUnits, 18, 2)} SQK` : "—"}
          sub={mining?.rangeCheckpointCount !== undefined ? `${formatCount(mining.rangeCheckpointCount)} checkpoints` : undefined}
        />
      </div>

      <h3 className="sub-title">Squeek blocks per hour</h3>
      <BarChart bars={bars} color="var(--gold)" height={130} emptyText="No settlement activity in this window" />

      {mining?.nextRound ? (
        <p className="fine-print">
          next funding round {formatCount(mining.nextRound.round)} is{" "}
          <Chip tone={mining.nextRound.state === "ready" ? "green" : "blue"}>{mining.nextRound.state}</Chip>{" "}
          · {formatCount(mining.nextRound.completedBlockCount)} blocks so far ·{" "}
          {formatCompact(mining.nextRound.amountBaseUnits, 18, 2)} SQK projected · rounds funded through{" "}
          {formatCount(mining.processedThroughRound)}
        </p>
      ) : null}

      <h3 className="sub-title">Recent settlements</h3>
      {data && data.recentSettlements.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Rounds</th>
              <th>Blocks</th>
              <th>Work</th>
              <th>SQK</th>
              <th>When</th>
              <th>Tx</th>
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
                    : "pending"}
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
        <p className="chart-empty">No settlements that completed blocks in this window</p>
      )}
    </Panel>
  );
}
