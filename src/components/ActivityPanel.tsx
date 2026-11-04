import type { StatsResponse } from "../lib/types";
import { formatBps, formatCount, formatDistance, formatRpm, formatSpeed, toNum } from "../lib/format";
import { useI18n } from "../lib/i18n";
import { AreaChart, BarChart } from "./Charts";
import { Notice, Panel, Stat } from "./ui";

function RecordChip({
  label,
  record,
  format,
}: {
  label: string;
  record?: { value: string | number } | null;
  format: (v: string | number) => string;
}) {
  if (!record) return null;
  return (
    <div className="record-chip">
      <span className="record-label">{label}</span>
      <span className="record-value">{format(record.value)}</span>
    </div>
  );
}

export function ActivityPanel({ data }: { data: StatsResponse | null }) {
  const { t } = useI18n();
  const days = data?.activity.days ?? [];
  const dayBars = days.map((day) => ({
    key: day.date,
    label: day.date.slice(5), // MM-DD
    value: toNum(day.observedWorkUnits) ?? 0,
    title: `${day.date} · ${formatCount(day.observedWorkUnits)} units · ${formatDistance(day.distanceMm)}`,
  }));

  const typical = (data?.activity.typicalDay ?? []).map((slot) => toNum(slot.meanWorkMilli) ?? 0);
  const rounds = data?.rounds;

  return (
    <Panel
      title={t("act.title")}
      subtitle={t("act.sub")}
      right={
        rounds?.activeRateBps !== undefined ? (
          <span className="mono">
            {t("act.activeRounds")} {formatBps(rounds.activeRateBps)}
          </span>
        ) : null
      }
    >
      {data?.reason ? (
        <Notice tone="warn">
          {t("act.title")}: {data.reason}
        </Notice>
      ) : null}

      <div className="stat-row">
        <Stat label={t("act.lifetimeWork")} value={formatCount(data?.lifetime.acceptedWorkUnits)} sub={t("act.acceptedUnits")} />
        <Stat label={t("act.lifetimeDist")} value={formatDistance(data?.lifetime.observedDistanceMm)} tone="green" />
        <Stat label={t("act.settledBlocks")} value={formatCount(data?.lifetime.settledBlockCount)} tone="gold" />
        <Stat label={t("act.activeDays")} value={formatCount(data?.lifetime.activeDayCount)} />
        <Stat label={t("act.coverage")} value={formatBps(data?.lifetime.coverageBps)} sub={t("act.coverageSub")} />
      </div>

      <BarChart bars={dayBars} color="var(--blue)" height={150} emptyText={t("act.noData")} />

      <h3 className="sub-title">{t("act.typical")}</h3>
      <AreaChart
        points={typical}
        labelFor={(i) => `${String(Math.floor((i * 30) / 60)).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"} UTC`}
      />

      <div className="record-grid">
        <RecordChip label={t("act.rec.halfHour")} record={data?.records.mostWorkHalfHour} format={(v) => `${formatCount(v)} ${t("act.rec.units")}`} />
        <RecordChip label={t("act.rec.day")} record={data?.records.mostWorkUtcDay} format={(v) => `${formatCount(v)} ${t("act.rec.units")}`} />
        <RecordChip label={t("act.rec.dist")} record={data?.records.maximumDailyDistanceMm} format={(v) => formatDistance(v)} />
        <RecordChip label={t("act.rec.rpm")} record={data?.records.peakObservedRpmMilli} format={(v) => formatRpm(toNum(v))} />
        <RecordChip label={t("act.rec.speed")} record={data?.records.peakObservedSpeedMmPerSecond} format={(v) => `${formatSpeed(toNum(v))} km/h`} />
        <RecordChip label={t("act.rec.streak")} record={data?.records.longestActiveDayStreak} format={(v) => `${formatCount(v)} ${t("act.rec.days")}`} />
      </div>
    </Panel>
  );
}
