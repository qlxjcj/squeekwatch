import { useState } from "react";
import type { AccountResponse, SqueekResponse } from "../lib/types";
import { apiGet, explorerAddress } from "../lib/api";
import {
  formatCount,
  formatUnits,
  isAddress,
  isZeroAddress,
  shortHex,
} from "../lib/format";
import { BarChart } from "./Charts";
import { Chip, Notice, Panel, Stat } from "./ui";

const EXAMPLE_ACCOUNT = "0x828cb04dbf0bdd8eb35d19045638a1af6e3d17e8"; // Hamster-Owned Liquidity Safe

export function AccountLookup() {
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
      setAccountError("Enter a valid non-zero 0x address (40 hex characters).");
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
      setSqueekError("Token ID must be a number from 1 to 9999.");
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
    <Panel
      title="Account & Squeek lookup"
      subtitle="Rewards, power and Squeeks for any address · images served as data URIs, rendered safely"
    >
      <div className="lookup-form">
        <input
          className="lookup-input mono"
          placeholder="0x… wallet address"
          value={addressInput}
          onChange={(e) => setAddressInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void lookupAccount(addressInput);
          }}
          spellCheck={false}
        />
        <button type="button" className="btn btn-primary" onClick={() => void lookupAccount(addressInput)} disabled={accountLoading}>
          {accountLoading ? "loading…" : "look up"}
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => {
            setAddressInput(EXAMPLE_ACCOUNT);
            void lookupAccount(EXAMPLE_ACCOUNT);
          }}
        >
          try example
        </button>
      </div>
      {accountError ? <Notice tone="error">{accountError}</Notice> : null}

      {account && account.status === "available" ? (
        <div className="account-card">
          <div className="stat-row">
            <Stat
              label="Claimable now"
              value={`${formatUnits(account.rewards.claimableBaseUnits, 18, 4)} SQK`}
              tone="gold"
            />
            <Stat label="Lifetime claimed" value={`${formatUnits(account.rewards.lifetimePaidBaseUnits, 18, 2)} SQK`} />
            <Stat label="NFT power" value={formatCount(account.power.nftPower)} sub="from deposited Squeeks" />
            <Stat label="SQK power" value={formatCount(account.power.sqkPower)} sub="from staked SQK" />
            <Stat
              label="Squeeks"
              value={formatCount(
                (Number(account.tokenCounts?.staking ?? 0) + Number(account.tokenCounts?.wallet ?? 0)).toString(),
              )}
              sub={`${account.tokenCounts?.staking ?? 0} staking · ${account.tokenCounts?.wallet ?? 0} wallet`}
            />
          </div>

          {account.stake ? (
            <p className="fine-print">
              staked principal {formatUnits(account.stake.principalBaseUnits, 18, 2)} SQK (
              {formatUnits(account.stake.freshBaseUnits, 18, 2)} fresh · {formatUnits(account.stake.matureBaseUnits, 18, 2)} mature)
            </p>
          ) : null}

          {account.earnings && account.earnings.length > 0 ? (
            <>
              <h3 className="sub-title">Earnings · last 7 days</h3>
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
              <h3 className="sub-title">Squeeks held (click to view)</h3>
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
                    <span>LV {token.level}</span>
                    <Chip tone={token.custody === "staking" ? "purple" : "blue"}>{token.custody}</Chip>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="chart-empty">No Squeeks in this account</p>
          )}

          <p className="fine-print">
            account <a href={explorerAddress(account.account)} target="_blank" rel="noopener noreferrer" className="mono">{shortHex(account.account)}</a>
            {account.claimRecipient ? (
              <>
                {" "}· claims pay to{" "}
                <a href={explorerAddress(account.claimRecipient)} target="_blank" rel="noopener noreferrer" className="mono">
                  {shortHex(account.claimRecipient)}
                </a>
              </>
            ) : null}
          </p>
        </div>
      ) : account && account.reason ? (
        <Notice tone="warn">Account unavailable: {account.reason}</Notice>
      ) : null}

      <h3 className="sub-title">Squeek viewer</h3>
      <div className="lookup-form">
        <input
          className="lookup-input mono"
          placeholder="token ID (1–9999)"
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void lookupSqueek(tokenInput);
          }}
          inputMode="numeric"
        />
        <button type="button" className="btn btn-primary" onClick={() => void lookupSqueek(tokenInput)} disabled={squeekLoading}>
          {squeekLoading ? "loading…" : "view Squeek"}
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
            <div className="squeek-art squeek-art-placeholder">no art yet</div>
          )}
          <div className="squeek-meta">
            <h3>{squeek.metadata?.name ?? `Squeek #${squeek.tokenId}`}</h3>
            <div className="stat-row">
              <Stat label="Level" value={squeek.level} />
              <Stat label="Base power" value={formatCount(squeek.basePower)} tone="gold" />
              <Stat label="Merge state" value={squeek.mergeState ?? "—"} sub={`next merge at block #${formatCount(squeek.nextMergeHeight)}`} />
            </div>
            <p className="fine-print">
              owner{" "}
              <a href={explorerAddress(squeek.custody.owner ?? "")} target="_blank" rel="noopener noreferrer" className="mono">
                {shortHex(squeek.custody.owner)}
              </a>
              {squeek.custody.depositor ? (
                <>
                  {" "}· deposited by <span className="mono">{shortHex(squeek.custody.depositor)}</span>
                </>
              ) : null}
              {squeek.custody.burned ? " · burned" : ""}
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
        <Notice tone="warn">Squeek unavailable: {squeek.reason}</Notice>
      ) : null}
    </Panel>
  );
}
