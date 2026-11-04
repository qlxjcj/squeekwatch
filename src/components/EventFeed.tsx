import type { EventRow, EventsResponse } from "../lib/types";
import { formatAgo, formatEventValue, shortHex } from "../lib/format";
import { explorerTx } from "../lib/api";
import { Chip, Notice, Panel } from "./ui";

const TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  "system.settlement_completed": { label: "Settlement confirmed", icon: "⚡" },
  "system.mining_checkpointed": { label: "Mining checkpoint", icon: "🪙" },
  "account.rewards_claimed": { label: "Rewards claimed", icon: "💰" },
  "account.claim_recipient_set": { label: "Claim recipient set", icon: "📮" },
  "account.rewards_staked": { label: "Rewards auto-staked", icon: "📈" },
  "account.sqk_staked": { label: "SQK staked", icon: "🔒" },
  "account.sqk_unstaked": { label: "SQK unstaked", icon: "🔓" },
  "nft.deposited": { label: "Squeek deposited", icon: "🐹" },
  "nft.withdrawn": { label: "Squeek withdrawn", icon: "🐹" },
  "nft.merged": { label: "Squeeks merged", icon: "🧬" },
  "nft.launch_claimed": { label: "Genesis claimed", icon: "🎁" },
  "measurement.distance_milestone": { label: "Distance milestone", icon: "🏁" },
  "measurement.daily_distance_milestone": { label: "Daily distance record", icon: "📅" },
  "measurement.speed_milestone": { label: "Speed milestone", icon: "💨" },
  "measurement.speed_record": { label: "New top speed!", icon: "🏆" },
  "measurement.distance_streak": { label: "Distance streak", icon: "🔥" },
};

const CATEGORY_TONE: Record<string, string> = {
  protocol: "blue",
  players: "purple",
  measurement: "green",
};

function eventCategory(type: string): string {
  if (type.startsWith("system.")) return "protocol";
  if (type.startsWith("measurement.")) return "measurement";
  return "players";
}

/** Show a handful of the most meaningful payload values per event. */
function payloadSummary(event: EventRow): string {
  const entries = Object.entries(event.payload)
    .filter(([, v]) => v !== null && v !== undefined && typeof v !== "object")
    .slice(0, 4);
  return entries
    .map(([key, value]) => {
      const formatted = formatEventValue(key, value);
      return formatted ? `${key.replace(/BaseUnits$/, "")} ${formatted}` : null;
    })
    .filter((s): s is string => s !== null)
    .join(" · ");
}

export function EventFeed({ data }: { data: EventsResponse | null }) {
  return (
    <Panel
      title="Live event feed"
      subtitle="Settlements, checkpoints, claims, stakes, merges and wheel milestones"
      right={data ? <Chip tone="gray">{data.category}</Chip> : null}
    >
      {data?.reason ? <Notice tone="warn">Event feed unavailable: {data.reason}</Notice> : null}
      <div className="event-feed">
        {data && data.events.length > 0 ? (
          data.events.slice(0, 18).map((event) => {
            const meta = TYPE_LABELS[event.type] ?? { label: event.type, icon: "•" };
            const category = eventCategory(event.type);
            return (
              <div key={event.id} className="event-row">
                <span className="event-icon" aria-hidden="true">
                  {meta.icon}
                </span>
                <div className="event-body">
                  <div className="event-top">
                    <strong>{meta.label}</strong>
                    <Chip tone={CATEGORY_TONE[category] ?? "gray"}>{category}</Chip>
                    <span className="event-time">{formatAgo(event.occurredAt)}</span>
                  </div>
                  <p className="event-detail">{payloadSummary(event)}</p>
                </div>
                {event.source.kind === "chain" && event.source.transactionHash ? (
                  <a
                    className="event-link mono"
                    href={explorerTx(event.source.transactionHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={event.source.transactionHash}
                  >
                    {shortHex(event.source.transactionHash)}
                  </a>
                ) : (
                  <span className="event-link mono muted">device</span>
                )}
              </div>
            );
          })
        ) : (
          <p className="chart-empty">Waiting for the first events…</p>
        )}
      </div>
    </Panel>
  );
}
