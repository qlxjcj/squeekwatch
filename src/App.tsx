import { apiGet } from "./lib/api";
import { I18nProvider } from "./lib/i18n";
import type {
  CoreResponse,
  EconomyStateResponse,
  EventsResponse,
  MeasurementBlocksResponse,
  SettlementsResponse,
  StatsResponse,
  StatusResponse,
} from "./lib/types";
import { usePoll } from "./hooks/usePoll";
import { Header, type FeedState } from "./components/Header";
import { Hero } from "./components/Hero";
import { LivePanel } from "./components/LivePanel";
import { ChainPanel } from "./components/ChainPanel";
import { ActivityPanel } from "./components/ActivityPanel";
import { SettlementsPanel } from "./components/SettlementsPanel";
import { EconomyPanel } from "./components/EconomyPanel";
import { EventFeed } from "./components/EventFeed";
import { AccountLookup } from "./components/AccountLookup";
import { Footer } from "./components/Footer";

// Polling intervals respect the API's per-IP rate limits:
// publicFast allows 30 r/s, publicHeavy 5 r/s, stats are cached for 60 s.
const INTERVALS = {
  status: 10_000,
  blocks: 30_000,
  core: 30_000,
  economy: 60_000,
  settlements: 60_000,
  events: 30_000,
  stats: 300_000,
} as const;

export default function App() {
  return (
    <I18nProvider>
      <Dashboard />
    </I18nProvider>
  );
}

function Dashboard() {
  const status = usePoll(() => apiGet<StatusResponse>("/v1/status"), INTERVALS.status);
  const blocks = usePoll(() => apiGet<MeasurementBlocksResponse>("/v1/measurement/blocks"), INTERVALS.blocks);
  const core = usePoll(() => apiGet<CoreResponse>("/v1/core"), INTERVALS.core);
  const economy = usePoll(() => apiGet<EconomyStateResponse>("/v1/economy/state"), INTERVALS.economy);
  const settlements = usePoll(
    () => apiGet<SettlementsResponse>("/v1/settlements?range=24h"),
    INTERVALS.settlements,
  );
  const events = usePoll(() => apiGet<EventsResponse>("/v1/events?category=all&limit=25"), INTERVALS.events);
  const stats = usePoll(() => apiGet<StatsResponse>("/v1/measurement/stats?range=7d"), INTERVALS.stats);

  const refreshAll = () => {
    status.refresh();
    blocks.refresh();
    core.refresh();
    economy.refresh();
    settlements.refresh();
    events.refresh();
    stats.refresh();
  };

  const feedState: FeedState =
    status.data === null
      ? status.error
        ? "offline"
        : "unknown"
      : status.data.measurement === null
        ? "unknown"
        : status.data.measurement.freshness === "online"
          ? "online"
          : "stale";

  return (
    <div className="app">
      <Header state={feedState} updatedAt={status.updatedAt} onRefresh={refreshAll} />
      <main className="app-main">
        <Hero core={core.data} economy={economy.data} settlements={settlements.data} />
        <LivePanel status={status.data} blocks={blocks.data} error={status.error} />
        <ChainPanel core={core.data} blocks={blocks.data} economy={economy.data} />
        <div className="two-col">
          <ActivityPanel data={stats.data} />
          <EconomyPanel data={economy.data} />
        </div>
        <SettlementsPanel data={settlements.data} />
        <div className="two-col">
          <EventFeed data={events.data} />
          <AccountLookup />
        </div>
      </main>
      <Footer />
    </div>
  );
}
