import type { ReactNode } from "react";
import Link from "next/link";
import { Icon } from "./Icon";

export { Icon };

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "primary";

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`badge${tone === "neutral" ? "" : ` badge-${tone}`}`}>{children}</span>;
}

export function Card({ title, actions, children, className = "", id }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  return (
    <section className={`card ${className}`} id={id}>
      {(title || actions) && (
        <div className="row-between" style={{ marginBottom: "var(--space-3)" }}>
          {title && <h2 className="card-title" style={{ margin: 0 }}>{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="page-header row-between">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="row">{actions}</div>}
    </header>
  );
}

export function Alert({ tone = "info", children }: { tone?: "info" | "success" | "warning" | "danger"; children: ReactNode }) {
  return <div className={`alert alert-${tone}`} role={tone === "danger" ? "alert" : "status"}>{children}</div>;
}

export type EmptyAction = { label: ReactNode; href: string } | { label: ReactNode; onClick: () => void };

/** Empty state with one clear next action. */
export function EmptyState({ icon = "inbox", children, action }: { icon?: string; children: ReactNode; action?: EmptyAction }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon name={icon} size={32} /></div>
      <p className="empty-text">{children}</p>
      {action && ("href" in action
        ? <Link href={action.href} className="btn btn-sm">{action.label}</Link>
        : <button type="button" className="btn btn-sm" onClick={action.onClick}>{action.label}</button>)}
    </div>
  );
}

export function Tabs({ items }: { items: { href: string; label: ReactNode; active: boolean }[] }) {
  return (
    <nav className="tabs">
      {items.map((it) => (
        <Link key={it.href} href={it.href} className="tab" aria-current={it.active ? "page" : undefined}>
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
