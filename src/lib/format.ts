import type { NumStr } from "./types";

/* ------------------------------------------------------------------ */
/* BigInt-aware number helpers. The API sends large numbers as decimal */
/* strings; never do math on them with floating point.                  */
/* ------------------------------------------------------------------ */

export function toBig(value: NumStr | bigint | null | undefined): bigint | null {
  if (value === null || value === undefined || value === "") return null;
  try {
    return typeof value === "bigint" ? value : BigInt(value);
  } catch {
    return null;
  }
}

export function toNum(value: NumStr | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

const group = (digits: string): string => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** Integer with thousands separators. */
export function formatCount(value: NumStr | bigint | null | undefined): string {
  const v = toBig(value);
  if (v === null) return "—";
  return (v < 0n ? "-" : "") + group((v < 0n ? -v : v).toString());
}

const POW10 = (n: number) => 10n ** BigInt(n);

/** Base units -> decimal string, e.g. 33157606255453613574932373 -> "33,157,606.25". */
export function formatUnits(
  base: NumStr | bigint | null | undefined,
  decimals: number,
  maxFrac = 2,
): string {
  const v = toBig(base);
  if (v === null) return "—";
  const neg = v < 0n;
  const abs = neg ? -v : v;
  const scale = POW10(decimals);
  const whole = abs / scale;
  const frac = abs % scale;
  let fracStr = "";
  if (maxFrac > 0 && frac > 0n) {
    const digits = frac.toString().padStart(decimals, "0").slice(0, maxFrac).replace(/0+$/, "");
    if (digits) fracStr = `.${digits}`;
  }
  return `${neg ? "-" : ""}${group(whole.toString())}${fracStr}`;
}

/** Base units -> compact string, e.g. 33157... -> "33.16M". */
export function formatCompact(
  base: NumStr | bigint | null | undefined,
  decimals: number,
  maxFrac = 2,
): string {
  const v = toBig(base);
  if (v === null) return "—";
  const neg = v < 0n;
  const abs = neg ? -v : v;
  const scale = POW10(decimals);
  const whole = abs / scale;
  const suffixes: Array<[bigint, string]> = [
    [1_000_000_000n, "B"],
    [1_000_000n, "M"],
    [1_000n, "K"],
  ];
  for (const [threshold, suffix] of suffixes) {
    if (whole >= threshold) {
      const scaled = (abs * 100n) / (scale * threshold);
      const int = scaled / 100n;
      const frac = (scaled % 100n).toString().padStart(2, "0").slice(0, maxFrac).replace(/0+$/, "");
      return `${neg ? "-" : ""}${int.toString()}${frac ? `.${frac}` : ""}${suffix}`;
    }
  }
  return `${neg ? "-" : ""}${formatUnits(abs, decimals, maxFrac)}`;
}

/* ------------------------------------------------------------------ */
/* Wheel telemetry                                                     */
/* ------------------------------------------------------------------ */

export const formatRpm = (rpmMilli: number | null | undefined): string =>
  rpmMilli === null || rpmMilli === undefined ? "—" : (rpmMilli / 1000).toFixed(1);

/** Millimetres per second -> km/h. */
export const formatSpeed = (mmPerSecond: number | null | undefined): string =>
  mmPerSecond === null || mmPerSecond === undefined ? "—" : (mmPerSecond * 0.0036).toFixed(2);

/** Millimetres -> human distance. */
export function formatDistance(mm: NumStr | null | undefined): string {
  const n = toNum(mm);
  if (n === null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} km`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)} m`;
  return `${Math.round(n)} mm`;
}

/** Basis points -> percent. */
export function formatBps(bps: NumStr | null | undefined): string {
  const n = toNum(bps);
  return n === null ? "—" : `${(n / 100).toFixed(1)}%`;
}

/* ------------------------------------------------------------------ */
/* Time                                                                */
/* ------------------------------------------------------------------ */

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleTimeString();
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

export function formatAgo(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const seconds = Math.max(0, Math.round((now - t) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0s";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/* ------------------------------------------------------------------ */
/* Hex and addresses                                                   */
/* ------------------------------------------------------------------ */

export function shortHex(value: string | null | undefined, lead = 6, tail = 4): string {
  if (!value) return "—";
  return value.length <= lead + tail + 2 ? value : `${value.slice(0, lead)}…${value.slice(-tail)}`;
}

export const isAddress = (value: string): boolean => /^0x[0-9a-fA-F]{40}$/.test(value);
export const isZeroAddress = (value: string): boolean => /^0x0{40}$/i.test(value);

/* ------------------------------------------------------------------ */
/* Event payload formatting (defensive: values are loosely typed)      */
/* ------------------------------------------------------------------ */

export function formatEventValue(key: string, value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = typeof value === "string" ? value : String(value);
  if (key.endsWith("BaseUnits")) return `${formatUnits(text, 18, 4)} SQK`;
  if (key.endsWith("DistanceMm")) return formatDistance(text);
  if (key.endsWith("SpeedMmPerSecond")) {
    const n = toNum(text);
    return n === null ? "—" : `${formatSpeed(n)} km/h`;
  }
  if (key.endsWith("Bps")) return formatBps(text);
  if (key.endsWith("Timestamp") || key.endsWith("At")) {
    if (/^\d+$/.test(text)) return formatDateTime(new Date(Number(text) * 1000).toISOString());
    return formatDateTime(text);
  }
  if (/^0x[0-9a-fA-F]{17,}$/.test(text)) return shortHex(text);
  if (/^\d+$/.test(text)) return formatCount(text);
  return text;
}
