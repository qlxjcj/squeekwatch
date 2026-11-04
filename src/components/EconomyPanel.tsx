import type { EconomyStateResponse } from "../lib/types";
import { formatCompact, formatCount, formatUnits, toBig } from "../lib/format";
import { ProgressBar } from "./Charts";
import { Chip, Notice, Panel, Stat } from "./ui";

export function EconomyPanel({ data }: { data: EconomyStateResponse | null }) {
  const supply = data?.supply;
  const staking = data?.staking;
  const nft = data?.nft;
  const decimals = Number(data?.asset.decimals ?? 18);

  const cap = toBig(supply?.capBaseUnits);
  const live = toBig(supply?.liveSupplyBaseUnits);
  const supplyPct = cap !== null && live !== null && cap > 0n ? Number((live * 10_000n) / cap) / 10_000 : 0;

  return (
    <Panel
      title="SQK economy"
      subtitle={`ERC-20 on Sepolia · cap 2.1B · each completed Squeek block issues 6,900 SQK`}
      right={
        data ? (
          <Chip tone={data.lifecycle.paused ? "red" : "green"}>
            mining {data.lifecycle.paused ? "paused" : data.lifecycle.stage}
          </Chip>
        ) : null
      }
    >
      {data?.reason ? <Notice tone="warn">Economy state unavailable: {data.reason}</Notice> : null}

      <div className="stat-row">
        <Stat
          label="Live supply"
          value={`${formatCompact(supply?.liveSupplyBaseUnits, decimals, 2)} SQK`}
          sub={`of 2.1B cap · ${(supplyPct * 100).toFixed(2)}%`}
          tone="gold"
        />
        <Stat label="Mined by the wheel" value={`${formatCompact(supply?.miningMintedBaseUnits, decimals, 2)} SQK`} />
        <Stat label="Unminted capacity" value={`${formatCompact(supply?.unmintedCapacityBaseUnits, decimals, 2)} SQK`} />
        <Stat
          label="Total staked"
          value={staking ? `${formatCompact(staking.totalStakedBaseUnits, decimals, 2)} SQK` : "—"}
          sub={staking ? `staking ${staking.paused ? "paused" : "active"}` : "staking not bound yet"}
          tone="purple"
        />
      </div>

      <div className="supply-bar">
        <div className="block-progress-head">
          <span>supply vs cap</span>
          <span className="mono">
            {formatUnits(supply?.liveSupplyBaseUnits, decimals, 0)} / {formatUnits(supply?.capBaseUnits, decimals, 0)}
          </span>
        </div>
        <ProgressBar value={supplyPct} tone="gold" height={12} />
      </div>

      <div className="stat-row">
        <Stat label="Squeeks issued" value={formatCount(nft?.issued)} sub="Genesis collection: 9,999" tone="blue" />
        <Stat label="Squeeks alive" value={formatCount(nft?.live)} sub={`${formatCount(nft?.burned)} burned (merges)`} />
        <Stat
          label="Merges"
          value={nft?.mergesOpen ? "open" : "closed"}
          sub={`levels up to ${nft?.maximumLevel ?? "—"}`}
        />
        <Stat
          label="Total power staked"
          value={staking ? formatCount(staking.totalNftPower) : "—"}
          sub={staking ? `${formatCount(staking.totalSqkPower)} from staked SQK` : undefined}
        />
      </div>

      {nft && nft.basePower.length > 0 ? (
        <>
          <h3 className="sub-title">Squeek levels (base power & merge cooldown)</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Level</th>
                {nft.basePower.slice(0, 10).map((_, i) => (
                  <th key={i}>{i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Power</td>
                {nft.basePower.slice(0, 10).map((power, i) => (
                  <td key={i} className="mono">
                    {formatCount(power)}
                  </td>
                ))}
              </tr>
              <tr>
                <td>Cooldown</td>
                {nft.cooldownBlocks.slice(0, 10).map((cd, i) => (
                  <td key={i} className="mono">
                    {formatCount(cd)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </>
      ) : null}

      <p className="fine-print">
        Checkpoints fund rounds with SQK in two streams: the game vault (gacha) and staking rewards.
        Distribution and values are testnet policy, not a promise for mainnet.
      </p>
    </Panel>
  );
}
