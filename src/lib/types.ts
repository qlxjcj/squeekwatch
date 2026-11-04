// Response types for the Squeekchain public API.
// Source: https://docs.squeekchain.com/developers/api/
//
// Per the API conventions, large numbers (IDs, amounts, block numbers, work)
// arrive as decimal strings, while small values (levels, speeds) are plain
// integers. `NumStr` covers fields whose exact JSON type may shift as the API
// evolves — the docs say to expect schema drift and unknown fields.

export type NumStr = string | number;

/** Most endpoints answer HTTP 200 with `status: "unavailable"` and a reason. */
export type Availability = "available" | "unavailable";

export interface Unavailable {
  status: "unavailable";
  reason?: string;
}

/* ------------------------------------------------------------------ */
/* GET /v1/status                                                      */
/* ------------------------------------------------------------------ */

export interface Measurement {
  freshness: "online" | "stale";
  observedAt: string;
  receivedAt: string;
  counterEpoch: string;
  cumulativeWorkUnits: NumStr;
  provenance: "hardware" | "simulated" | "replay" | "derived";
  coreStatus: "IDLE" | "ACTIVE" | "COUNTER_FAULT";
  rpmMilli: number;
  speedMmPerSecond: number;
  distanceMm: number;
}

export interface StatusAnchor {
  settledThroughRound: NumStr;
  cumulativeWork: NumStr;
  blockHeight: NumStr;
  blockProgress: NumStr;
  workPerThousandBlocks: NumStr;
  cumulativeBlockUnits: NumStr;
  transactionHash: string;
  confirmedAt: string;
}

export interface StatusResponse {
  revision: string;
  measurement: Measurement | null;
  builder: {
    status: Availability;
    reason?: string;
    anchor?: StatusAnchor;
    queued?: {
      closedRoundCount: NumStr;
      closedWorkUnits: NumStr;
      openRoundWorkUnits: NumStr;
    };
    projected?: {
      lifecycle: "optimistic";
      firstCompletedBlock: NumStr;
      lastCompletedBlock: NumStr;
      completedBlockCount: NumStr;
    };
  };
  oracle: {
    state: "accepted" | "stale" | "blocked" | "unavailable";
    reason?: string;
    latestClosure?: {
      firstRound: NumStr;
      lastRound: NumStr;
      roundCount: NumStr;
      acceptedAt: string;
    } | null;
  };
  settlementQueue: {
    status: Availability;
    reason?: string;
    state: "disabled" | "empty" | "ready" | "preparing" | "submitted" | "retrying" | "blocked" | "stale";
    buffered?: {
      firstRound: NumStr;
      lastRound: NumStr;
      roundCount: NumStr;
      activeRoundCount: NumStr;
      workUnits: NumStr;
    };
    projected?: {
      firstCompletedBlock: NumStr;
      lastCompletedBlock: NumStr;
      completedBlockCount: NumStr;
    };
    latestSubmission?: {
      lifecycle: "preparing" | "submitted" | "retrying" | "confirmed" | "reverted" | "superseded";
      transactionHash?: string;
      outcomeCode?: string;
      [key: string]: unknown;
    } | null;
  };
  signer?: {
    kind: string;
    algorithm: string;
    keySlot?: NumStr;
    enrolledAt?: string;
    lastVerifiedAt?: string;
  } | null;
  modules?: Array<{
    instanceId: string;
    moduleType: string;
    driverId?: string;
    moduleVersion?: string;
    observedAt?: string;
    provenance?: string;
    state: "disabled" | "starting" | "ready" | "degraded" | "faulted" | "stopped";
    health?: { checkedAt?: string; code?: string; message?: string };
  }>;
}

/* ------------------------------------------------------------------ */
/* GET /v1/measurement/blocks                                          */
/* ------------------------------------------------------------------ */

export interface ProvisionalBlock {
  height: NumStr;
  workThreshold: NumStr;
  roundId: NumStr;
  completingAt: string | null;
}

export interface MeasurementBlocksResponse {
  status: Availability;
  reason?: string;
  freshness: "fresh" | "stale" | "unavailable";
  observedAt: string | null;
  receivedAt: string | null;
  provenance: string | null;
  profile: string | null;
  chain: { chainId: NumStr; coreAddress: string; graphManifestDigest?: string };
  roundSchedule: { genesisTimestamp: NumStr; roundDurationSeconds: NumStr };
  anchor: {
    cumulativeWork: NumStr;
    cumulativeBlockUnits: NumStr;
    blockHeight: NumStr;
    blockProgress: NumStr;
    workPerThousandBlocks: NumStr;
    settledThroughRound: NumStr;
    confirmedAt: string;
    transactionHash: string;
  };
  projected: {
    cumulativeWork: NumStr;
    cumulativeBlockUnits: NumStr;
    blockHeight: NumStr;
    blockProgress: NumStr;
    workPerThousandBlocks: NumStr;
  };
  blocks: ProvisionalBlock[];
}

/* ------------------------------------------------------------------ */
/* GET /v1/core                                                        */
/* ------------------------------------------------------------------ */

export interface CoreEventRow {
  id: string;
  contractKind?: string;
  contractAddress?: string;
  eventName: string;
  blockNumber?: NumStr;
  transactionHash?: string;
  timestamp?: string;
  arguments?: Array<{ name: string; value: unknown }> | Record<string, unknown>;
}

export interface CoreResponse {
  status: Availability;
  reason?: string;
  identities: {
    core: string;
    proxyImplementation: string;
    proxyAdmin: string;
    proxyAdminOwner: string;
    operatorTimelock: string;
    operatorProposer: string;
  };
  configuration: {
    streamId: string;
    genesisTimestamp: NumStr;
    roundDuration: NumStr;
    maxWorkPerRound: NumStr;
    maxRoundsPerBatch: NumStr;
    guardian: string;
    reporter: string;
    initialWorkPerThousandBlocks: NumStr;
    targetBlocksPerActiveRound: NumStr;
    difficultySmoothingRounds: NumStr;
    blockUnitsPerBlock: NumStr;
  };
  core: {
    settledThroughRound: NumStr;
    cumulativeWork: NumStr;
    blockHeight: NumStr;
    blockProgress: NumStr;
    workPerThousandBlocks: NumStr;
    cumulativeBlockUnits: NumStr;
    paused: boolean;
  };
  implementation: {
    codeAddress: string;
    codeVersion: NumStr;
    storageLayoutDigest: string;
    runtimeHash: string;
  };
  governance: {
    operationId: string;
    operationKind: string;
    operationState: string;
  } | null;
  source?: { eventName?: string; [key: string]: unknown };
  events?: CoreEventRow[];
}

/* ------------------------------------------------------------------ */
/* GET /v1/settlements                                                 */
/* ------------------------------------------------------------------ */

export interface SettlementRow {
  previousSettledThroughRound: NumStr;
  settledThroughRound: NumStr;
  activeRoundCount: NumStr;
  workAdded: NumStr;
  cumulativeWork: NumStr;
  firstCompletedBlock: NumStr;
  lastCompletedBlock: NumStr;
  completedBlockCount: NumStr;
  blockHeight: NumStr;
  cumulativeBlockUnits: NumStr;
  transactionHash: string;
  ethereumBlockNumber: NumStr;
  blockTimestamp: string;
  logIndex: NumStr;
  confirmationStatus?: string;
  sqkMintedBaseUnits?: NumStr | null;
  [key: string]: unknown;
}

/** Bucket field names are not fully documented; read them defensively. */
export type SettlementBucket = Record<string, unknown>;

export interface SettlementsResponse {
  status: Availability;
  reason?: string;
  range: "now" | "24h" | "7d" | "30d";
  window: { startAt: string; endAt: string; bucketSeconds: NumStr } | null;
  summary: {
    settlementCount: NumStr;
    activeRoundCount: NumStr;
    workAdded: NumStr;
    completedBlockCount: NumStr;
    archivedSettlementCount: NumStr;
  };
  recentSettlements: SettlementRow[];
  buckets: SettlementBucket[];
  mining?: {
    status: Availability;
    reason?: string;
    economy?: { release: string; mining: string; token: string; symbol: string; decimals: NumStr };
    supplyCap?: NumStr;
    premintBaseUnits?: NumStr;
    startRound?: NumStr | null;
    startHeight?: NumStr | null;
    miningMintedBaseUnits?: NumStr;
    unmintedCapacityBaseUnits?: NumStr;
    rangeMintedBaseUnits?: NumStr;
    rangeCheckpointCount?: NumStr;
    processedThroughRound?: NumStr;
    nextRound?: {
      state: "accruing" | "ready";
      round: NumStr;
      countedThroughRound: NumStr;
      startsAt: string;
      endsAt: string;
      completedBlockCount: NumStr;
      amountBaseUnits: NumStr;
      [key: string]: unknown;
    };
    recentCheckpoints?: Array<Record<string, unknown>>;
    [key: string]: unknown;
  };
  recentRounds?: Array<{ roundId: NumStr; endAt: string; sqkMintedBaseUnits: NumStr | null }>;
  previousPeriod?: Record<string, unknown>;
}

/* ------------------------------------------------------------------ */
/* GET /v1/events                                                      */
/* ------------------------------------------------------------------ */

export interface EventRow {
  id: string;
  eventVersion: number;
  type: string;
  occurredAt: string;
  recordedAt: string;
  source: {
    kind: "chain" | "measurement";
    transactionHash?: string;
    blockNumber?: NumStr;
    contractAddress?: string;
    [key: string]: unknown;
  };
  payload: Record<string, unknown>;
}

export interface EventsResponse {
  status: Availability;
  reason?: string;
  catalogVersion: string;
  category: "all" | "protocol" | "players" | "measurement";
  activeEventTypes: string[];
  events: EventRow[];
  nextCursor: string | null;
}

/* ------------------------------------------------------------------ */
/* GET /v1/economy/state                                               */
/* ------------------------------------------------------------------ */

export interface EconomyStateResponse {
  status: Availability;
  reason?: string;
  release?: { id: string };
  chain?: {
    safeThroughBlock: NumStr;
    safeBlockHash: string;
    safeBlockTimestamp: string;
  };
  identities?: {
    core: string;
    token: string;
    genesis: string;
    mining?: { proxy: string; implementation?: string; codeVersion?: NumStr } | null;
    staking?: { proxy: string; implementation?: string } | null;
  };
  asset: { address: string; symbol: string; decimals: NumStr };
  lifecycle: {
    stage: "bootstrapped" | "staking_bound" | "scheduled" | "active";
    startRound: NumStr | null;
    currentRound: NumStr;
    paused: boolean;
    guardian: string;
  };
  supply: {
    capBaseUnits: NumStr;
    premintBaseUnits: NumStr;
    miningMintedBaseUnits: NumStr;
    totalMintedBaseUnits: NumStr;
    totalBurnedBaseUnits: NumStr;
    liveSupplyBaseUnits: NumStr;
    unmintedCapacityBaseUnits: NumStr;
  };
  schedule: {
    allowanceBaseUnits: NumStr;
    launchBonusBaseUnits: NumStr;
    bonusBlocks: NumStr;
    halvingBlocks: NumStr;
    firstPeriodRateBaseUnits: NumStr;
    startHeight: NumStr | null;
    closedThroughBlock: NumStr | null;
    issuedBaseUnits: NumStr;
  };
  mining: {
    processedThroughRound: NumStr;
    fundedBlocks: NumStr;
    gachaFundedBaseUnits: NumStr;
    stakingFundedBaseUnits: NumStr;
    [key: string]: unknown;
  };
  staking: null | {
    totalStakedBaseUnits: NumStr;
    freshPrincipalBaseUnits: NumStr;
    totalNftPower: NumStr;
    totalSqkPower: NumStr;
    paused: boolean;
    launchReady: boolean;
    [key: string]: unknown;
  };
  nft: {
    issued: NumStr;
    burned: NumStr;
    live: NumStr;
    mergesOpen: boolean;
    maximumLevel: number;
    basePower: NumStr[];
    cooldownBlocks: NumStr[];
  };
}

/* ------------------------------------------------------------------ */
/* GET /v1/measurement/stats?range=7d                                  */
/* ------------------------------------------------------------------ */

export interface StatRecord {
  value: NumStr;
  occurredAt?: string;
  coverage?: unknown;
}

export interface ActivityDay {
  date: string;
  coverage?: unknown;
  observedWorkUnits: NumStr;
  distanceMm: NumStr;
  buckets?: Array<Record<string, unknown>>;
}

export interface TypicalSlot {
  startMinuteUtc: number;
  totalWorkUnits: NumStr;
  observedDayCount: NumStr;
  meanWorkMilli: NumStr;
}

export interface StatsResponse {
  status: Availability;
  reason?: string;
  revision: string;
  window: {
    startAt: string;
    endAt: string;
    dayCount: number;
    bucketSeconds: number;
    roundSeconds: number;
  };
  lifetime: {
    acceptedWorkUnits: NumStr;
    observedDistanceMm: NumStr;
    activeDayCount: NumStr;
    settledBlockCount: NumStr;
    settlementCount: NumStr;
    settledWorkUnits: NumStr;
    coverageBps: NumStr;
    firstObservedAt: string | null;
  };
  activity: {
    coverage?: Record<string, unknown>;
    summary?: Record<string, unknown>;
    days: ActivityDay[];
    typicalDay: TypicalSlot[];
  };
  records: {
    mostWorkHalfHour?: StatRecord | null;
    mostWorkUtcDay?: StatRecord | null;
    maximumDailyDistanceMm?: StatRecord | null;
    peakObservedRpmMilli?: StatRecord | null;
    peakObservedSpeedMmPerSecond?: StatRecord | null;
    longestActiveWindowMinutes?: StatRecord | null;
    longestActiveDayStreak?: StatRecord | null;
    [key: string]: StatRecord | null | undefined;
  };
  blocks?: Record<string, unknown>;
  rounds?: {
    observedRoundCount?: NumStr;
    activeRoundCount?: NumStr;
    zeroWorkRoundCount?: NumStr;
    missingRoundCount?: NumStr;
    activeRateBps?: NumStr;
    [key: string]: unknown;
  };
  oracle?: Record<string, unknown>;
}

/* ------------------------------------------------------------------ */
/* GET /v1/accounts/{address} and /v1/squeeks/{tokenId}                */
/* ------------------------------------------------------------------ */

export interface AccountToken {
  tokenId: string;
  custody: "staking" | "wallet";
  level: number;
  basePower: NumStr;
  nextMergeHeight: NumStr;
  mergeState: "ready" | "cooldown" | "terminal" | "merges_closed";
  metadataStatus?: string;
}

export interface AccountResponse {
  status: Availability;
  reason?: string;
  account: string;
  economy?: {
    currentRound: NumStr;
    coreBlockHeight: NumStr;
    mergesOpen: boolean;
    stakingPaused: boolean;
    maximumLevel: number;
  };
  claimRecipient: string | null;
  rewards: {
    claimableBaseUnits: NumStr;
    remainderScaled?: NumStr;
    lifetimePaidBaseUnits: NumStr;
    lifetimeCompoundedBaseUnits: NumStr;
  };
  power: { nftPower: NumStr; sqkPower: NumStr };
  stake?: {
    principalBaseUnits: NumStr;
    freshBaseUnits: NumStr;
    matureBaseUnits: NumStr;
    freshUntilRound?: NumStr;
  };
  earnings?: Array<{ date: string; earnedBaseUnits: NumStr }>;
  tokenCounts?: { staking: NumStr; wallet: NumStr };
  tokens?: AccountToken[];
  nextCursor?: string | null;
}

export interface SqueekResponse {
  status: Availability;
  reason?: string;
  tokenId: string;
  custody: {
    owner: string | null;
    depositor: string | null;
    stray: boolean;
    burned: boolean;
  };
  level: number;
  basePower: NumStr;
  nextMergeHeight: NumStr;
  mergeState: "ready" | "cooldown" | "terminal" | "merges_closed" | null;
  economy?: {
    currentRound: NumStr;
    coreBlockHeight: NumStr;
    mergesOpen: boolean;
    stakingPaused: boolean;
    maximumLevel: number;
  };
  metadata: null | {
    status?: "pending";
    refreshedAtBlock?: NumStr;
    name?: string;
    description?: string;
    imageDataUri?: string;
    cardImageUrl?: string;
    attributes?: Array<{ traitType: string; value: string | number }>;
  };
}
