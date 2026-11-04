import type { StatsResponse } from "../lib/types";
import { formatBps, formatCount, formatDistance, formatRpm, formatSpeed, toNum } from "../lib/format";
import { AreaChart, BarChart } from "./Charts";
import { Notice, Panel, Stat } from "./ui";

function RecordChip({ label, record, format }: { label: string; record?: { value: string | number } | null; format: (v: string | number) => string }) {
  if (!record) return null;
  return (
    <div className="record-chip">
      <span className="record-label">{label}</span>
      <span className="record-value">{format(record.value)}</span>
    </div>
  );
}

export function ActivityPanel({ data }: { data: StatsResponse | null }) {
  const days = data?.activity.days ?? [];
  const dayBars = days.map((day) => ({
    key: day.date,
    label: day.date.slice(5), // MM-DD
    value: toNum(day.observedWorkUnits) ?? 0,
    title: `${day.date} · ${formatCount(day.observedWorkUnits)} work units · ${formatDistance(day.distanceMm)}`,
  }));

  const typical = (data?.activity.typicalDay ?? []).map((slot) => toNum(slot.meanWorkMilli) ?? 0);
  const rounds = data?.rounds;

  return (
    <Panel
      title="Wheel activity · last 7 days"
      subtitle="Observed work units per UTC day (days run noon to noon, matching the device)"
      right={rounds?.activeRateBps !== undefined ? <span className="mono">active rounds {formatBps(rounds.activeRateBps)}</span> : null}
    >
      {data?.reason ? <Notice tone="warn">Statistics unavailable: {data.reason}</Notice> : null}

      <div className="stat-row">
        <Stat label="Lifetime work" value={formatCount(data?.lifetime.acceptedWorkUnits)} sub="accepted work units" />
        <Stat label="Lifetime distance" value={formatDistance(data?.lifetime.observedDistanceMm)} tone="green" />
        <Stat label="Settled Squeek blocks" value={formatCount(data?.lifetime.settledBlockCount)} tone="gold" />
        <Stat label="Active days" value={formatCount(data?.lifetime.activeDayCount)} />
        <Stat label="Coverage" value={formatBps(data?.lifetime.coverageBps)} sub="observed vs expected rounds" />
      </div>

      <BarChart bars={dayBars} color="var(--blue)" height={150} emptyText="No activity recorded yet" />

      <h3 className="sub-title">A typical day (average by half hour, UTC)</h3>
      <AreaChart
        points={typical}
        labelFor={(i) => `${String(Math.floor((i * 30) / 60)).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"} UTC`}
      />

      <div className="record-grid">
        <RecordChip label="Most work · half hour" record={data?.records.mostWorkHalfHour} format={(v) => `${formatCount(v)} units`} />
        <RecordChip label="Most work · day" record={data?.records.mostWorkUtcDay} format={(v) => `${formatCount(v)} units`} />
        <RecordChip label="Longest daily distance" record={data?.records.maximumDailyDistanceMm} format={(v) => formatDistance(v)} />
        <RecordChip label="Peak RPM" record={data?.records.peakObservedRpmMilli} format={(v) => formatRpm(toNum(v))} />
        <RecordChip label="Top speed" record={data?.records.peakObservedSpeedMmPerSecond} format={(v) => `${formatSpeed(toNum(v))} km/h`} />
        <RecordChip label="Longest day streak" record={data?.records.longestActiveDayStreak} format={(v) => `${formatCount(v)} days`} />
      </div>
    </Panel>
  );
}
