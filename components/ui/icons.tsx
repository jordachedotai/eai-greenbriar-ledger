// Line icons from design-reference. 20px in the sidebar, 18 in buttons.

type P = { size?: number; className?: string; stroke?: string };
const base = (size: number, w = 1.8) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none", strokeWidth: w, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });

export function IconGrid({ size = 20, className, stroke = "currentColor" }: P) {
  return (
    <svg {...base(size)} stroke={stroke} className={className} aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
export function IconPatterns({ size = 20, className, stroke = "currentColor" }: P) {
  return (
    <svg {...base(size)} stroke={stroke} className={className} aria-hidden>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="12" cy="18" r="2.5" />
      <path d="M7.5 8l3.5 7.5" />
      <path d="M16.5 8L13 15.5" />
      <path d="M8.5 6h7" />
    </svg>
  );
}
export function IconReport({ size = 20, className, stroke = "currentColor" }: P) {
  return (
    <svg {...base(size)} stroke={stroke} className={className} aria-hidden>
      <path d="M6 3h8l5 5v13H6z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </svg>
  );
}
export function IconBook({ size = 20, className, stroke = "currentColor" }: P) {
  return (
    <svg {...base(size)} stroke={stroke} className={className} aria-hidden>
      <path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z" />
      <path d="M20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z" />
    </svg>
  );
}
export function IconSettings({ size = 20, className, stroke = "currentColor" }: P) {
  return (
    <svg {...base(size)} stroke={stroke} className={className} aria-hidden>
      <path d="M4 7h10" />
      <path d="M18 7h2" />
      <circle cx="16" cy="7" r="2" />
      <path d="M4 17h2" />
      <circle cx="8" cy="17" r="2" />
      <path d="M10 17h10" />
    </svg>
  );
}
export function IconChevronLeft({ size = 14, className }: P) {
  return (
    <svg {...base(size, 2)} stroke="currentColor" className={className} aria-hidden>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}
export function IconChevronRight({ size = 14, className, stroke = "currentColor" }: P) {
  return (
    <svg {...base(size, 2.2)} stroke={stroke} className={className} aria-hidden>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
export function IconChevronDown({ size = 12, className }: P) {
  return (
    <svg {...base(size, 2.5)} stroke="currentColor" className={className} aria-hidden>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
export function IconX({ size = 12, className }: P) {
  return (
    <svg {...base(size, 2.5)} stroke="currentColor" className={className} aria-hidden>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}
export function IconCheck({ size = 12, className }: P) {
  return (
    <svg {...base(size, 3)} stroke="currentColor" className={className} aria-hidden>
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}
export function IconPresenter({ size = 16 }: P) {
  return (
    <svg {...base(size, 1.8)} stroke="currentColor" aria-hidden>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M12 16v4" />
      <path d="M8 20h8" />
    </svg>
  );
}
export function IconQuote({ size = 18, stroke = "currentColor" }: P) {
  return (
    <svg {...base(size)} stroke={stroke} aria-hidden>
      <path d="M7 7h4v4H7z" />
      <path d="M13 7h4v4h-4z" />
      <path d="M11 11c0 3-1 4-3 5" />
      <path d="M17 11c0 3-1 4-3 5" />
    </svg>
  );
}
export function IconMic({ size = 18, stroke = "currentColor" }: P) {
  return (
    <svg {...base(size)} stroke={stroke} aria-hidden>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </svg>
  );
}
