// Left column, 272px: the company's initiatives as small cards with a flag
// cell and a short status. The selected card carries the flag color as a
// left border. Selection lives in the URL (?initiative=). Below: the rules.

import Link from "next/link";
import type { Initiative } from "@/lib/types";
import { FLAG_COLORS } from "@/lib/flags";
import { plural } from "@/lib/format";
import { FlagCell } from "@/components/Portfolio/StatusPill";
import { LABEL } from "@/components/ui/Button";
import { Criteria } from "./Criteria";
import { tabHref } from "./Tabs";

export function InitiativeList({ companyId, initiatives, selectedId }: { companyId: string; initiatives: Initiative[]; selectedId: string }) {
  return (
    <div className="flex flex-col gap-2.5" data-testid="initiative-list">
      <span className={LABEL}>{plural(initiatives.length, "initiative")}</span>
      {initiatives.map((i) => {
        const on = i.id === selectedId;
        const c = FLAG_COLORS[i.status.flag];
        return (
          <Link
            key={i.id}
            href={tabHref(companyId, "initiatives", i.id)}
            scroll={false}
            aria-current={on ? "true" : undefined}
            data-testid="initiative-card"
            data-initiative={i.id}
            data-selected={on ? "true" : "false"}
            className="flex flex-col gap-1 rounded-[10px] px-3.5 py-3 transition-colors"
            style={{
              background: on ? c.bg : "#ffffff",
              border: `1px solid ${on ? c.line : "#dde3da"}`,
              borderLeft: on ? `4px solid ${c.text}` : undefined,
              paddingLeft: on ? 11 : undefined,
            }}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="text-[15px] font-semibold leading-[1.3]">{i.name}</span>
              <FlagCell flag={i.status.flag} title={i.status.pill} />
            </span>
            <span className="line-clamp-2 text-[13px] leading-[1.4] text-mut">{i.status.sentence}</span>
          </Link>
        );
      })}
      <Criteria />
    </div>
  );
}
