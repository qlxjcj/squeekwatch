import type { EconomyStateResponse } from "../lib/types";
import { formatCompact, formatCount, formatUnits, toBig } from "../lib/format";
import { useI18n } from "../lib/i18n";
import { ProgressBar } from "./Charts";
import { Chip, Notice, Panel, Stat } from "./ui";

export function EconomyPanel({ data }: { data: EconomyStateResponse | null }) {
  const { t } = useI18n();
  const supply = data?.supply;
  const staking = data?.staking;
  const nft = data?.nft;
  const decimals = Number(data?.asset.decimals ?? 18);

  const cap = toBig(supply?.capBaseUnits);
  const live = toBig(supply?.liveSupplyBaseUnits);
  const supplyPct = cap !== null && live !== null && cap > 0n ? Number((live * 10_000n) / cap) / 10_000 : 0;

  return (
    <Panel
      title={t("eco.title")}
      subtitle={t("eco.sub")}
      right={
        data ? (
          <Chip tone={data.lifecycle.paused ? "red" : "green"}>
            {data.lifecycle.paused ? t("eco.miningPaused") : `${t("eco.miningWord")} · ${data.lifecycle.stage}`}
          </Chip>
        ) : null
      }
    >
      {data?.reason ? (
        <Notice tone="warn">
          {t("eco.title")}: {data.reason}
        </Notice>
      ) : null}

      <div className="stat-row">
        <Stat
          label={t("eco.liveSupply")}
          value={`${formatCompact(supply?.liveSupplyBaseUnits, decimals, 2)} SQK`}
          sub={`${t("eco.ofCap")} · ${(supplyPct * 100).toFixed(2)}%`}
          tone="gold"
        />
        <Stat label={t("eco.minedBy")} value={`${formatCompact(supply?.miningMintedBaseUnits, decimals, 2)} SQK`} />
        <Stat label={t("eco.unminted")} value={`${formatCompact(supply?.unmintedCapacityBaseUnits, decimals, 2)} SQK`} />
        <Stat
          label={t("eco.totalStaked")}
          value={staking ? `${formatCompact(staking.totalStakedBaseUnits, decimals, 2)} SQK` : "—"}
          sub={staking ? (staking.paused ? t("eco.stakingPaused") : t("eco.stakingActive")) : t("eco.stakingUnbound")}
          tone="purple"
        />
      </div>

      <div className="supply-bar">
        <div className="block-progress-head">
          <span>{t("eco.supplyVsCap")}</span>
          <span className="mono">
            {formatUnits(supply?.liveSupplyBaseUnits, decimals, 0)} / {formatUnits(supply?.capBaseUnits, decimals, 0)}
          </span>
        </div>
        <ProgressBar value={supplyPct} tone="gold" height={12} />
      </div>

      <div className="stat-row">
        <Stat label={t("eco.issued")} value={formatCount(nft?.issued)} sub={t("eco.genesisCap")} tone="blue" />
        <Stat label={t("eco.alive")} value={formatCount(nft?.live)} sub={`${formatCount(nft?.burned)} ${t("eco.burned")}`} />
        <Stat
          label={t("eco.merges")}
          value={nft?.mergesOpen ? t("eco.open") : t("eco.closed")}
          sub={`${t("eco.levelsUpTo")} ${nft?.maximumLevel ?? "—"}`}
        />
        <Stat
          label={t("eco.totalPower")}
          value={staking ? formatCount(staking.totalNftPower) : "—"}
          sub={staking ? `${formatCount(staking.totalSqkPower)} ${t("eco.fromSqk")}` : undefined}
        />
      </div>

      {nft && nft.basePower.length > 0 ? (
        <>
          <h3 className="sub-title">{t("eco.levelTable")}</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("acc.level")}</th>
                {nft.basePower.slice(0, 10).map((_, i) => (
                  <th key={i}>{i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{t("eco.powerRow")}</td>
                {nft.basePower.slice(0, 10).map((power, i) => (
                  <td key={i} className="mono">
                    {formatCount(power)}
                  </td>
                ))}
              </tr>
              <tr>
                <td>{t("eco.cooldownRow")}</td>
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

      <p className="fine-print">{t("eco.note")}</p>
    </Panel>
  );
}
