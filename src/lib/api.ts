// Thin client for the Squeekchain public API (read-only, no key required).
// https://docs.squeekchain.com/developers/api/
//
// Rate limits are per IP and per endpoint class; the app polls conservatively
// (see App.tsx) and retries 429/503 responses after Retry-After.

export const API_BASE = "https://api.squeekchain.com";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    const response = await fetch(new URL(path, API_BASE), {
      headers: { accept: "application/json" },
      signal,
    });
    if ((response.status === 429 || response.status === 503) && attempt < 3) {
      const seconds = Number(response.headers.get("retry-after") ?? "2");
      await sleep(Math.min(seconds, 10) * 1000);
      continue;
    }
    if (response.status === 404) throw new Error(`${path}: not found`);
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return (await response.json()) as T;
  }
}

export const EXPLORER = "https://eth-sepolia.blockscout.com";
export const explorerTx = (hash: string) => `${EXPLORER}/tx/${hash}`;
export const explorerAddress = (address: string) => `${EXPLORER}/address/${address}`;

export const CONTRACTS = {
  SqueekCore: "0x74665dAecA35A2303e767E76a2FF1FB6F93e119f",
  SqueekMining: "0x3beE588fC20dE788Bac17d33b41Da7346cb27EC4",
  SqueekToken: "0x6872bfa5ccc3e9e440c6c16e5ffdabb8dba4cc76",
  SqueekNFT: "0x0eAF3E0d40A0a8E5a6Ac030b2459E9FB0B7905c6",
  DotGridRenderer: "0x2dC7661D172fEf0FC900E0aD0f4ffCE68E8bfD75",
} as const;

export const DOCS = "https://docs.squeekchain.com";
export const OFFICIAL = "https://squeekchain.com";
