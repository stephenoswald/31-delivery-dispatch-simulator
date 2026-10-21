import type { ReactNode, ButtonHTMLAttributes } from 'react';
import { Box, RefreshCw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { STATUS_LABELS } from '../../lib/constants';
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand">
      <span className="brand-symbol">
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path d="m21 4-12 12h14L11 28" />
        </svg>
      </span>
      {!compact && (
        <span>
          Swift<span className="brand-weight">Dispatch</span>
          <sup>®</sup>
        </span>
      )}
    </span>
  );
}
export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}) {
  return (
    <button {...props} className={`button button-${variant} ${className}`}>
      {children}
    </button>
  );
}
export function Badge({ status }: { status: string }) {
  return (
    <span className={`badge badge-${status.toLowerCase()}`}>
      <i />
      {STATUS_LABELS[status.toLowerCase()] ?? status.replaceAll('_', ' ')}
    </span>
  );
}
export function Avatar({ name, size = 'normal' }: { name: string; size?: 'normal' | 'large' }) {
  return (
    <span className={`avatar avatar-${size}`} aria-hidden="true">
      {name
        .split(' ')
        .filter(Boolean)
        .slice(-2)
        .map((s) => s[0])
        .join('')}
    </span>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      <div className="heading-actions">{actions}</div>
    </div>
  );
}
export function Stat({
  label,
  value,
  icon: Icon = Box,
  detail,
  tone = 'green',
}: {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  detail?: string;
  tone?: string;
}) {
  return (
    <div className="stat">
      <div className="stat-top">
        <span>{label}</span>
        <span className={`icon-tile tone-${tone}`}>
          <Icon size={18} />
        </span>
      </div>
      <strong>{value}</strong>
      <div className="stat-detail">{detail ?? 'Port Harcourt workspace'}</div>
    </div>
  );
}
export function Panel({
  title,
  subtitle,
  action,
  children,
  className = '',
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      {title && (
        <div className="panel-heading">
          <div>
            <h2>{title}</h2>
            {subtitle && <p className="muted small">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function Empty({
  title = 'Nothing here yet',
  description = 'Your activity will appear here.',
  action,
  icon: Icon = Box,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon size={26} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function Loading() {
  return (
    <div className="skeleton-page" role="status" aria-label="Loading workspace">
      <span className="sr-only">Loading workspace</span>
      <div className="skeleton skeleton-heading" />
      <div className="skeleton-stats">
        {[1, 2, 3, 4].map((n) => (
          <div className="skeleton" key={n} />
        ))}
      </div>
      <div className="skeleton skeleton-content" />
    </div>
  );
}
export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  return (
    <div className="error-state" role="alert">
      <h3>We couldn’t load this view</h3>
      <p>{error instanceof Error ? error.message : 'Please try again.'}</p>
      {retry && (
        <Button variant="secondary" onClick={retry}>
          <RefreshCw size={16} />
          Try again
        </Button>
      )}
    </div>
  );
}
export function Feedback({ error, success }: { error?: string; success?: string }) {
  return error ? (
    <p className="form-error" role="alert">
      {error}
    </p>
  ) : success ? (
    <p className="form-success" role="status">
      {success}
    </p>
  ) : null;
}
