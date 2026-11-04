import type { EventRow, EventsResponse } from "../lib/types";
import { formatAgo, formatEventValue, shortHex } from "../lib/format";
import { explorerTx } from "../lib/api";
import { useI18n, type Lang } from "../lib/i18n";
import { Chip, Notice, Panel } from "./ui";

const TYPE_LABELS: Record<string, { label: Record<Lang, string>; icon: string }> = {
  "system.settlement_completed": { label: { en: "Settlement confirmed", zh: "结算已确认" }, icon: "⚡" },
  "system.mining_checkpointed": { label: { en: "Mining checkpoint", zh: "挖矿检查点" }, icon: "🪙" },
  "account.rewards_claimed": { label: { en: "Rewards claimed", zh: "奖励已领取" }, icon: "💰" },
  "account.claim_recipient_set": { label: { en: "Claim recipient set", zh: "设置领取地址" }, icon: "📮" },
  "account.rewards_staked": { label: { en: "Rewards auto-staked", zh: "奖励自动质押" }, icon: "📈" },
  "account.sqk_staked": { label: { en: "SQK staked", zh: "SQK 已质押" }, icon: "🔒" },
  "account.sqk_unstaked": { label: { en: "SQK unstaked", zh: "SQK 已解除质押" }, icon: "🔓" },
  "nft.deposited": { label: { en: "Squeek deposited", zh: "Squeek 已存入" }, icon: "🐹" },
  "nft.withdrawn": { label: { en: "Squeek withdrawn", zh: "Squeek 已取回" }, icon: "🐹" },
  "nft.merged": { label: { en: "Squeeks merged", zh: "Squeek 已合并" }, icon: "🧬" },
  "nft.launch_claimed": { label: { en: "Genesis claimed", zh: "Genesis 已领取" }, icon: "🎁" },
  "measurement.distance_milestone": { label: { en: "Distance milestone", zh: "里程里程碑" }, icon: "🏁" },
  "measurement.daily_distance_milestone": { label: { en: "Daily distance record", zh: "单日里程纪录" }, icon: "📅" },
  "measurement.speed_milestone": { label: { en: "Speed milestone", zh: "速度里程碑" }, icon: "💨" },
  "measurement.speed_record": { label: { en: "New top speed!", zh: "新最高速度！" }, icon: "🏆" },
  "measurement.distance_streak": { label: { en: "Distance streak", zh: "连续里程达成" }, icon: "🔥" },
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
  const { t, lang } = useI18n();
  return (
    <Panel
      title={t("evt.title")}
      subtitle={t("evt.sub")}
      right={data ? <Chip tone="gray">{data.category}</Chip> : null}
    >
      {data?.reason ? (
        <Notice tone="warn">
          {t("evt.title")}: {data.reason}
        </Notice>
      ) : null}
      <div className="event-feed">
        {data && data.events.length > 0 ? (
          data.events.slice(0, 18).map((event) => {
            const meta = TYPE_LABELS[event.type];
            const label = meta ? meta.label[lang] : event.type;
            const icon = meta ? meta.icon : "•";
            const category = eventCategory(event.type);
            return (
              <div key={event.id} className="event-row">
                <span className="event-icon" aria-hidden="true">
                  {icon}
                </span>
                <div className="event-body">
                  <div className="event-top">
                    <strong>{label}</strong>
                    <Chip tone={CATEGORY_TONE[category] ?? "gray"}>{t(`cat.${category}`)}</Chip>
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
                  <span className="event-link mono muted">{t("evt.device")}</span>
                )}
              </div>
            );
          })
        ) : (
          <p className="chart-empty">{t("evt.waiting")}</p>
        )}
      </div>
    </Panel>
  );
}
