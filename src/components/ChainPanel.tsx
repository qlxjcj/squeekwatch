import type { CoreResponse, EconomyStateResponse, MeasurementBlocksResponse } from "../lib/types";
import {
  formatCount,
  formatDuration,
  formatTime,
  toBig,
  toNum,
} from "../lib/format";
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
      title="Squeek blocks · settled work"
      subtitle="Height counts from cumulative block units, never from raw work"
      right={
        state ? (
          <Chip tone={state.paused ? "red" : "green"}>{state.paused ? "SETTLEMENT PAUSED" : "SETTLING"}</Chip>
        ) : null
      }
    >
      {core?.reason ? <Notice tone="warn">SqueekCore state unavailable: {core.reason}</Notice> : null}

      <div className="stat-row">
        <Stat
          label="Squeek block height"
          value={`#${formatCount(state?.blockHeight)}`}
          sub={blocks ? `projected #${formatCount(blocks.projected.blockHeight)}` : undefined}
          tone="gold"
        />
        <Stat
          label="Current round"
          value={currentRound ?? "—"}
          sub={roundEndsIn ? `next round in ${roundEndsIn}` : undefined}
        />
        <Stat
          label="Difficulty"
          value={`${formatCount(state?.workPerThousandBlocks)} / 1k blocks`}
          sub="work per thousand blocks"
        />
        <Stat label="Settled work" value={`${formatCount(state?.cumulativeWork)} units`} sub={`through round ${formatCount(state?.settledThroughRound)}`} />
        <Stat label="Cumulative block units" value={formatCount(state?.cumulativeBlockUnits)} />
      </div>

      <div className="block-progress">
        <div className="block-progress-head">
          <span>
            block #{formatCount(state ? (toBig(state.blockHeight) ?? 0n) + 1n : null)} progress
          </span>
          <span className="mono">
            {formatCount(progress)} / {formatCount(units)} units · {(progressPct * 100).toFixed(1)}%
          </span>
        </div>
        <ProgressBar value={progressPct} tone="gold" height={12} />
      </div>

      <h3 className="sub-title">Provisional blocks (accepted work, awaiting settlement)</h3>
      {blocks && blocks.status === "available" && blocks.blocks.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Height</th>
              <th>Round</th>
              <th>Work threshold</th>
              <th>Crossed at</th>
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
          {blocks?.reason ? `Provisional blocks unavailable (${blocks.reason})` : "No provisional blocks right now"}
        </p>
      )}
      <p className="fine-print">
        Provisional blocks are wheel work not yet settled on Ethereum. They issue no SQK until the
        Reporter's settlement confirms and SqueekMining checkpoints the rounds.
      </p>
    </Panel>
  );
}
