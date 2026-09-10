// Buttons from the artboards: brand (green), you (blue, the only color
// that asks for a click), secondary (white with a ring). 40px tall by
// default, 36 for the smaller ones on cards.

import Link from "next/link";

type Variant = "brand" | "you" | "secondary";

const VARIANT: Record<Variant, string> = {
  brand: "bg-brand text-white shadow-[0_1px_2px_rgba(20,63,31,0.3)] hover:bg-brand2",
  you: "bg-you text-white shadow-[0_1px_2px_rgba(43,95,158,0.35)] hover:bg-[#244f85]",
  secondary: "border border-ring bg-white text-txt hover:bg-bg",
};

export function Button({
  variant = "secondary",
  size = 40,
  children,
  onClick,
  href,
  testId,
  className = "",
  title,
}: {
  variant?: Variant;
  size?: 40 | 36;
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  testId?: string;
  className?: string;
  title?: string;
}) {
  const cls =
    "inline-flex items-center justify-center whitespace-nowrap rounded-[10px] font-semibold transition-colors " +
    (size === 40 ? "h-10 px-[18px] text-[15px] " : "h-9 px-3.5 text-[14px] ") +
    VARIANT[variant] +
    " " +
    className;
  if (href) {
    return (
      <Link href={href} className={cls} data-testid={testId} title={title}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls} data-testid={testId} title={title}>
      {children}
    </button>
  );
}

// The small uppercase label above a block.
export const LABEL = "text-[13px] font-semibold uppercase tracking-[0.04em] text-mut";
