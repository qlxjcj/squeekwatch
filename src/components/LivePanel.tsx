import type { MeasurementBlocksResponse, StatusResponse } from "../lib/types";
import { formatAgo, formatCount, formatDistance, formatSpeed, shortHex, toBig } from "../lib/format";
import { explorerTx } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { Gauge } from "./Charts";
import { Chip, Notice, Panel, Stat } from "./ui";

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
  const { t } = useI18n();
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
      title={t("live.title")}
      subtitle={t("live.sub")}
      right={
        m ? (
          <Chip tone={m.freshness === "online" ? "green" : "gold"}>
            {m.coreStatus} · {m.provenance}
          </Chip>
        ) : null
      }
    >
      {error && !status ? (
        <Notice tone="error">
          {t("live.unavailable")}: {error}
        </Notice>
      ) : null}

      <div className="live-grid">
        <div className="live-gauge">
          <Gauge value={rpm} max={gaugeMax} label={t("live.rpm")} unit="RPM" />
          <div className="live-quick">
            <Stat label={t("live.speed")} value={m ? `${formatSpeed(m.speedMmPerSecond)} km/h` : "—"} />
            <Stat label={t("live.distance")} value={formatDistance(m?.distanceMm)} />
            <Stat
              label={t("live.workunits")}
              value={formatCount(m?.cumulativeWorkUnits)}
              sub={m ? `${t("live.observed")} ${formatAgo(m.observedAt)}` : undefined}
            />
          </div>
        </div>

        <div className="pipeline">
          <h3 className="sub-title">{t("live.pipeline")}</h3>
          <StageRow
            name={t("live.device")}
            state={m?.freshness ?? "unknown"}
            tone={m?.freshness === "online" ? "green" : "gold"}
            detail={m ? `reading ${formatAgo(m.observedAt)} · ${m.provenance}` : t("live.nomsg")}
          />
          <StageRow
            name={t("live.oracle")}
            state={oracle?.state ?? "unknown"}
            tone={oracle?.state === "accepted" ? "green" : oracle?.state === "blocked" ? "red" : "gold"}
            detail={
              oracle?.latestClosure
                ? `${t("live.acceptedRounds")} ${formatCount(oracle.latestClosure.firstRound)}–${formatCount(oracle.latestClosure.lastRound)}`
                : oracle?.reason
            }
          />
          <StageRow
            name={t("live.queue")}
            state={queue?.state ?? "unknown"}
            tone={queue?.state === "empty" || queue?.state === "submitted" ? "green" : queue?.state === "blocked" ? "red" : "blue"}
            detail={
              queue?.buffered
                ? `${formatCount(queue.buffered.roundCount)} ${t("live.roundsBuffered")} · ${formatCount(queue.buffered.workUnits)} ${t("live.workUnitsWord")}`
                : queue?.reason
            }
          />
          <StageRow
            name={t("live.settled")}
            state={builder?.status === "available" ? t("live.confirmed") : (builder?.reason ?? "unknown")}
            tone={builder?.status === "available" ? "green" : "gold"}
            detail={anchor ? `block #${formatCount(anchor.blockHeight)} · ${formatAgo(anchor.confirmedAt)}` : undefined}
          />
          {queue?.latestSubmission?.transactionHash ? (
            <p className="fine-print">
              {t("live.latestSettlement")}{" "}
              <Chip tone={queue.latestSubmission.lifecycle === "confirmed" ? "green" : "blue"}>
                {queue.latestSubmission.lifecycle}
              </Chip>{" "}
              <a href={explorerTx(queue.latestSubmission.transactionHash)} target="_blank" rel="noopener noreferrer">
                {queue.latestSubmission.transactionHash.slice(0, 10)}…
              </a>
            </p>
          ) : null}
        </div>

        <div className="live-side">
          <h3 className="sub-title">{t("live.inflight")}</h3>
          <Stat
            label={t("live.queuedWork")}
            value={formatCount(queuedWork)}
            sub={builder?.queued ? `${formatCount(builder.queued.closedRoundCount)} ${t("live.closedRounds")}` : undefined}
          />
          <Stat
            label={t("live.projected")}
            value={formatCount(projectedBlocks)}
            sub={t("live.optimistic")}
            tone="gold"
          />
          <Stat
            label={t("live.lastSettlement")}
            value={anchor ? formatAgo(anchor.confirmedAt) : "—"}
            sub={
              anchor ? (
                <a href={explorerTx(anchor.transactionHash)} target="_blank" rel="noopener noreferrer">
                  {anchor.transactionHash.slice(0, 10)}…
                </a>
              ) : undefined
            }
          />
          {m ? (
            <Stat
              label={t("live.counterEpoch")}
              value={shortHex(m.counterEpoch, 8, 4)}
              sub={`${formatCount(m.cumulativeWorkUnits)} ${t("live.epochWork")}`}
            />
          ) : null}
          {status?.signer ? (
            <Stat label={t("live.signer")} value={status.signer.kind} sub={status.signer.algorithm} />
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
