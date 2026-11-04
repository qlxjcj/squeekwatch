import type { MeasurementBlocksResponse, StatusResponse } from "../lib/types";
import { formatAgo, formatCount, formatDistance, formatSpeed, shortHex, toBig } from "../lib/format";
import { explorerTx } from "../lib/api";
import { Gauge } from "./Charts";
import { Chip, OutLink, Panel, Stat } from "./ui";

function StageRow({ name, state, detail, tone }: { name: string; state: string; detail?: string; tone?: string }) {
  return (
    <div className="stage-row">
      <Chip tone={tone ?? "gray"}>{state}</Chip>
      <div className="stage-text">
        <strong>{name}</strong>
        {detail ? <span>{detail}</span> : null}
      </div>
    </div>
  );
}

export function LivePanel({
  status,
  blocks,
  error,
}: {
  status: StatusResponse | null;
  blocks: MeasurementBlocksResponse | null;
  error: string | null;
}) {
  const m = status?.measurement ?? null;
  const rpm = m ? m.rpmMilli / 1000 : 0;
  const gaugeMax = Math.max(20, rpm * 1.25);

  const builder = status?.builder;
  const queue = status?.settlementQueue;
  const oracle = status?.oracle;
  const anchor = builder?.anchor ?? blocks?.anchor ?? null;

  // Work recorded but not yet settled on Ethereum.
  const queuedWork =
    builder?.queued !== undefined
      ? (toBig(builder.queued.closedWorkUnits) ?? 0n) + (toBig(builder.queued.openRoundWorkUnits) ?? 0n)
      : queue?.buffered?.workUnits;

  // Optimistic: how many Squeek blocks the queued work would complete.
  const projectedBlocks = blocks?.projected
    ? (toBig(blocks.projected.blockHeight) ?? 0n) - (toBig(blocks.anchor.blockHeight) ?? 0n)
    : builder?.projected?.completedBlockCount;

  return (
    <Panel
      title="The Wheel · live telemetry"
      subtitle="Straight from the WHEELY9000 sensor, through the Oracle, to Ethereum"
      right={
        m ? (
          <Chip tone={m.freshness === "online" ? "green" : "gold"}>
            {m.coreStatus} · {m.provenance}
          </Chip>
        ) : null
      }
    >
      {error && !status ? <p className="chart-empty">Status unavailable: {error}</p> : null}

      <div className="live-grid">
        <div className="live-gauge">
          <Gauge value={rpm} max={gaugeMax} label="wheel speed" unit="RPM" />
          <div className="live-quick">
            <Stat label="Running speed" value={m ? `${formatSpeed(m.speedMmPerSecond)} km/h` : "—"} />
            <Stat label="Distance today" value={formatDistance(m?.distanceMm)} />
            <Stat
              label="Work units (counter epoch)"
              value={formatCount(m?.cumulativeWorkUnits)}
              sub={m ? `observed ${formatAgo(m.observedAt)}` : undefined}
            />
          </div>
        </div>

        <div className="pipeline">
          <h3 className="sub-title">Pipeline</h3>
          <StageRow
            name="Device"
            state={m?.freshness ?? "unknown"}
            tone={m?.freshness === "online" ? "green" : "gold"}
            detail={m ? `reading ${formatAgo(m.observedAt)} · ${m.provenance}` : "no measurement yet"}
          />
          <StageRow
            name="Oracle validation"
            state={oracle?.state ?? "unknown"}
            tone={oracle?.state === "accepted" ? "green" : oracle?.state === "blocked" ? "red" : "gold"}
            detail={
              oracle?.latestClosure
                ? `accepted rounds ${formatCount(oracle.latestClosure.firstRound)}–${formatCount(oracle.latestClosure.lastRound)}`
                : oracle?.reason
            }
          />
          <StageRow
            name="Settlement queue"
            state={queue?.state ?? "unknown"}
            tone={queue?.state === "empty" || queue?.state === "submitted" ? "green" : queue?.state === "blocked" ? "red" : "blue"}
            detail={
              queue?.buffered
                ? `${formatCount(queue.buffered.roundCount)} rounds buffered · ${formatCount(queue.buffered.workUnits)} work units`
                : queue?.reason
            }
          />
          <StageRow
            name="Settled on Ethereum"
            state={builder?.status === "available" ? "confirmed" : (builder?.reason ?? "unknown")}
            tone={builder?.status === "available" ? "green" : "gold"}
            detail={
              anchor
                ? `block #${formatCount(anchor.blockHeight)} · ${formatAgo(anchor.confirmedAt)}`
                : undefined
            }
          />
          {queue?.latestSubmission?.transactionHash ? (
            <p className="fine-print">
              latest settlement:{" "}
              <Chip tone={queue.latestSubmission.lifecycle === "confirmed" ? "green" : "blue"}>
                {queue.latestSubmission.lifecycle}
              </Chip>{" "}
              <OutLink href={explorerTx(queue.latestSubmission.transactionHash)}>
                {queue.latestSubmission.transactionHash.slice(0, 10)}…
              </OutLink>
            </p>
          ) : null}
        </div>

        <div className="live-side">
          <h3 className="sub-title">In flight</h3>
          <Stat
            label="Queued (unsettled) work"
            value={formatCount(queuedWork)}
            sub={builder?.queued ? `${formatCount(builder.queued.closedRoundCount)} closed rounds` : undefined}
          />
          <Stat
            label="Projected new Squeek blocks"
            value={formatCount(projectedBlocks)}
            sub="optimistic · not settled yet"
            tone="gold"
          />
          <Stat
            label="Last settlement confirmed"
            value={anchor ? formatAgo(anchor.confirmedAt) : "—"}
            sub={
              anchor ? (
                <OutLink href={explorerTx(anchor.transactionHash)}>{anchor.transactionHash.slice(0, 10)}…</OutLink>
              ) : undefined
            }
          />
          {m ? (
            <Stat
              label="Counter epoch"
              value={shortHex(m.counterEpoch, 8, 4)}
              sub={`${formatCount(m.cumulativeWorkUnits)} work units counted from epoch start`}
            />
          ) : null}
          {status?.signer ? (
            <Stat label="Device signer" value={status.signer.kind} sub={status.signer.algorithm} />
          ) : null}
          {status?.modules && status.modules.length > 0 ? (
            <div className="module-chips">
              {status.modules.map((mod) => (
                <Chip key={mod.instanceId} tone={mod.state === "ready" ? "green" : mod.state === "faulted" ? "red" : "gold"}>
                  {mod.moduleType}: {mod.state}
                </Chip>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}
