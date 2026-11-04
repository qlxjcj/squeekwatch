import { useState } from "react";
import type { AccountResponse, SqueekResponse } from "../lib/types";
import { apiGet, explorerAddress } from "../lib/api";
import { formatCount, formatUnits, isAddress, isZeroAddress, shortHex } from "../lib/format";
import { useI18n } from "../lib/i18n";
import { BarChart } from "./Charts";
import { Chip, Notice, Panel, Stat } from "./ui";

const EXAMPLE_ACCOUNT = "0x828cb04dbf0bdd8eb35d19045638a1af6e3d17e8"; // Hamster-Owned Liquidity Safe

export function AccountLookup() {
  const { t } = useI18n();
  const [addressInput, setAddressInput] = useState("");
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);

  const [tokenInput, setTokenInput] = useState("");
  const [squeek, setSqueek] = useState<SqueekResponse | null>(null);
  const [squeekError, setSqueekError] = useState<string | null>(null);
  const [squeekLoading, setSqueekLoading] = useState(false);

  const lookupAccount = async (value: string) => {
    const address = value.trim();
    if (!isAddress(address) || isZeroAddress(address)) {
      setAccountError(t("acc.invalid"));
      setAccount(null);
      return;
    }
    setAccountLoading(true);
    setAccountError(null);
    try {
      setAccount(await apiGet<AccountResponse>(`/v1/accounts/${address.toLowerCase()}`));
    } catch (e) {
      setAccount(null);
      setAccountError(e instanceof Error ? e.message : String(e));
    } finally {
      setAccountLoading(false);
    }
  };

  const lookupSqueek = async (value: string) => {
    const id = value.trim();
    if (!/^\d{1,4}$/.test(id) || Number(id) < 1 || Number(id) > 9999) {
      setSqueekError(t("acc.invalidId"));
      setSqueek(null);
      return;
    }
    setSqueekLoading(true);
    setSqueekError(null);
    try {
      setSqueek(await apiGet<SqueekResponse>(`/v1/squeeks/${id}`));
    } catch (e) {
      setSqueek(null);
      setSqueekError(e instanceof Error ? e.message : String(e));
    } finally {
      setSqueekLoading(false);
    }
  };

  return (
    <Panel title={t("acc.title")} subtitle={t("acc.sub")}>
      <div className="lookup-form">
        <input
          className="lookup-input mono"
          placeholder={t("acc.placeholder")}
          value={addressInput}
          onChange={(e) => setAddressInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void lookupAccount(addressInput);
          }}
          spellCheck={false}
        />
        <button type="button" className="btn btn-primary" onClick={() => void lookupAccount(addressInput)} disabled={accountLoading}>
          {accountLoading ? t("acc.loading") : t("acc.lookup")}
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            setAddressInput(EXAMPLE_ACCOUNT);
            void lookupAccount(EXAMPLE_ACCOUNT);
          }}
        >
          {t("acc.tryExample")}
        </button>
      </div>
      {accountError ? <Notice tone="error">{accountError}</Notice> : null}

      {account && account.status === "available" ? (
        <div className="account-card">
          <div className="stat-row">
            <Stat label={t("acc.claimable")} value={`${formatUnits(account.rewards.claimableBaseUnits, 18, 4)} SQK`} tone="gold" />
            <Stat label={t("acc.lifetimeClaimed")} value={`${formatUnits(account.rewards.lifetimePaidBaseUnits, 18, 2)} SQK`} />
            <Stat label={t("acc.nftPower")} value={formatCount(account.power.nftPower)} sub={t("acc.fromSqueeks")} />
            <Stat label={t("acc.sqkPower")} value={formatCount(account.power.sqkPower)} sub={t("acc.fromStaked")} />
            <Stat
              label={t("acc.squeeks")}
              value={formatCount((Number(account.tokenCounts?.staking ?? 0) + Number(account.tokenCounts?.wallet ?? 0)).toString())}
              sub={`${account.tokenCounts?.staking ?? 0} ${t("acc.stakingWord")} · ${account.tokenCounts?.wallet ?? 0} ${t("acc.walletWord")}`}
            />
          </div>

          {account.stake ? (
            <p className="fine-print">
              {t("acc.stakedPrincipal")} {formatUnits(account.stake.principalBaseUnits, 18, 2)} SQK (
              {formatUnits(account.stake.freshBaseUnits, 18, 2)} {t("acc.fresh")} · {formatUnits(account.stake.matureBaseUnits, 18, 2)}{" "}
              {t("acc.mature")})
            </p>
          ) : null}

          {account.earnings && account.earnings.length > 0 ? (
            <>
              <h3 className="sub-title">{t("acc.earnings")}</h3>
              <BarChart
                height={100}
                color="var(--purple)"
                bars={account.earnings.map((row) => ({
                  key: row.date,
                  label: row.date.slice(5),
                  value: Number(formatUnits(row.earnedBaseUnits, 18, 6).replace(/,/g, "")) || 0,
                  title: `${row.date} · ${formatUnits(row.earnedBaseUnits, 18, 4)} SQK`,
                }))}
              />
            </>
          ) : null}

          {account.tokens && account.tokens.length > 0 ? (
            <>
              <h3 className="sub-title">{t("acc.held")}</h3>
              <div className="token-grid">
                {account.tokens.map((token) => (
                  <button
                    key={token.tokenId}
                    type="button"
                    className="token-chip"
                    onClick={() => {
                      setTokenInput(token.tokenId);
                      void lookupSqueek(token.tokenId);
                    }}
                  >
                    <span className="mono">#{token.tokenId}</span>
                    <span>
                      {t("acc.level")} {token.level}
                    </span>
                    <Chip tone={token.custody === "staking" ? "purple" : "blue"}>{token.custody}</Chip>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="chart-empty">{t("acc.none")}</p>
          )}

          <p className="fine-print">
            <span className="muted">{t("acc.owner")}</span>{" "}
            <a href={explorerAddress(account.account)} target="_blank" rel="noopener noreferrer" className="mono">
              {shortHex(account.account)}
            </a>
            {account.claimRecipient ? (
              <>
                {" "}
                · {t("acc.claimsPayTo")}{" "}
                <a href={explorerAddress(account.claimRecipient)} target="_blank" rel="noopener noreferrer" className="mono">
                  {shortHex(account.claimRecipient)}
                </a>
              </>
            ) : null}
          </p>
        </div>
      ) : account && account.reason ? (
        <Notice tone="warn">{account.reason}</Notice>
      ) : null}

      <h3 className="sub-title">{t("acc.viewer")}</h3>
      <div className="lookup-form">
        <input
          className="lookup-input mono"
          placeholder={t("acc.tokenPlaceholder")}
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void lookupSqueek(tokenInput);
          }}
          inputMode="numeric"
        />
        <button type="button" className="btn btn-primary" onClick={() => void lookupSqueek(tokenInput)} disabled={squeekLoading}>
          {squeekLoading ? t("acc.loading") : t("acc.viewSqueek")}
        </button>
      </div>
      {squeekError ? <Notice tone="error">{squeekError}</Notice> : null}

      {squeek && squeek.status === "available" ? (
        <div className="squeek-card">
          {/* The artwork is an on-chain SVG served as a data URI. Per the docs'
              security note, metadata is untrusted: it is rendered via <img>
              and never injected as markup. */}
          {squeek.metadata?.cardImageUrl || squeek.metadata?.imageDataUri ? (
            <img
              className="squeek-art"
              src={squeek.metadata.cardImageUrl ?? squeek.metadata.imageDataUri}
              alt={squeek.metadata.name ?? `Squeek #${squeek.tokenId}`}
            />
          ) : (
            <div className="squeek-art squeek-art-placeholder">{t("acc.noArt")}</div>
          )}
          <div className="squeek-meta">
            <h3>{squeek.metadata?.name ?? `Squeek #${squeek.tokenId}`}</h3>
            <div className="stat-row">
              <Stat label={t("acc.level")} value={squeek.level} />
              <Stat label={t("acc.basePower")} value={formatCount(squeek.basePower)} tone="gold" />
              <Stat
                label={t("acc.mergeState")}
                value={squeek.mergeState ?? "—"}
                sub={`${t("acc.nextMerge")} #${formatCount(squeek.nextMergeHeight)}`}
              />
            </div>
            <p className="fine-print">
              <span className="muted">{t("acc.owner")}</span>{" "}
              <a href={explorerAddress(squeek.custody.owner ?? "")} target="_blank" rel="noopener noreferrer" className="mono">
                {shortHex(squeek.custody.owner)}
              </a>
              {squeek.custody.depositor ? (
                <>
                  {" "}
                  · {t("acc.depositedBy")} <span className="mono">{shortHex(squeek.custody.depositor)}</span>
                </>
              ) : null}
              {squeek.custody.burned ? ` · ${t("acc.burned")}` : ""}
            </p>
            {squeek.metadata?.attributes && squeek.metadata.attributes.length > 0 ? (
              <div className="trait-grid">
                {squeek.metadata.attributes.map((attr) => (
                  <span key={attr.traitType} className="chip chip-gray">
                    {attr.traitType}: {attr.value}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : squeek && squeek.reason ? (
        <Notice tone="warn">{squeek.reason}</Notice>
      ) : null}
    </Panel>
  );
}
