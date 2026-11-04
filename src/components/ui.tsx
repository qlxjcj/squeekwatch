import type { ReactNode } from "react";

export function Panel({
  title,
  subtitle,
  right,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <header className="panel-head">
        <div>
          <h2 className="panel-title">{title}</h2>
          {subtitle ? <p className="panel-sub">{subtitle}</p> : null}
        </div>
        {right ? <div className="panel-right">{right}</div> : null}
      </header>
      <div className="panel-body">{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "gold" | "blue" | "green" | "purple";
}) {
  return (
    <div className={`stat ${tone ? `stat-${tone}` : ""}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {sub ? <span className="stat-sub">{sub}</span> : null}
    </div>
  );
}

export function Chip({ tone, children }: { tone?: string; children: ReactNode }) {
  return <span className={`chip ${tone ? `chip-${tone}` : ""}`}>{children}</span>;
}

export function OutLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "error"; children: ReactNode }) {
  return <div className={`notice notice-${tone}`}>{children}</div>;
}
