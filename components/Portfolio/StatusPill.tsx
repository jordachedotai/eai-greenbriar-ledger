// Status pill and the blue chip. Colors from lib/flags so the screen and
// the rules share one palette.

import type { Flag, PillText } from "@/lib/types";
import { FLAG_COLORS, YOU_COLORS } from "@/lib/flags";

export function StatusPill({ flag, text, bordered = false }: { flag: Flag; text: PillText | string; bordered?: boolean }) {
  const c = FLAG_COLORS[flag];
  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-[3px] text-[13px] font-semibold"
      style={{ background: c.bg, color: c.text, border: bordered ? `1px solid ${c.line}` : undefined }}
      data-testid="status-pill"
      data-flag={flag}
    >
      {text}
    </span>
  );
}

export function YouChip({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-[3px] text-[13px] font-semibold" style={{ background: YOU_COLORS.bg, color: YOU_COLORS.text }} data-testid="you-chip">
      {text}
    </span>
  );
}

// The 24px flag cell used in month strips, initiative lists, and the quote
// stack. One step darker than the pills so it reads on a projector: the
// tone's line color as the fill, the tone color as a 1px border.
export function FlagCell({ flag, title, size = 24 }: { flag: Flag; title?: string; size?: number }) {
  const c = FLAG_COLORS[flag];
  return <span className="inline-flex shrink-0 items-center justify-center rounded-[6px]" style={{ width: size, height: size, background: c.line, border: `1px solid ${c.text}` }} title={title} data-testid="flag-cell" data-flag={flag} />;
}
