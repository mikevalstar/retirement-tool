import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Settings, Wallet } from "lucide-react";
import { EmptyState } from "#/components/EmptyState";
import { InlineError } from "#/components/InlineError";
import { OwnerBadge } from "#/components/OwnerBadge";
import { fmtCAD } from "#/lib/formatters";
import { thCls, thCSS } from "#/lib/tableStyles";
import { getIncomeSources, getPensionProjections, SECTION_ACCENT } from "#/serverFns/income/sourceFns";

export const Route = createFileRoute("/income/")({
  component: IncomeDashboard,
  loader: async () => {
    const [sources, projections] = await Promise.all([getIncomeSources(), getPensionProjections()]);
    return { sources, projections };
  },
});

function IncomeDashboard() {
  const { sources, projections } = Route.useLoaderData();
  const pageError = null;

  const hasAnyBirthYear = projections.some((p) => p.hasBirthYear);

  const totalsByPerson = new Map<number, { name: string; annual: number }>();
  for (const source of sources) {
    const annual = source.frequency === "MONTHLY" ? source.amount * 12 : source.amount;
    const existing = totalsByPerson.get(source.ownerId);
    if (existing) {
      existing.annual += annual;
    } else {
      totalsByPerson.set(source.ownerId, { name: source.owner.name, annual });
    }
  }

  const totalAnnualIncome = sources.reduce((sum, s) => {
    return sum + (s.frequency === "MONTHLY" ? s.amount * 12 : s.amount);
  }, 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[10px]">
          <div className="w-1 h-5 rounded-[2px]" style={{ backgroundColor: SECTION_ACCENT }} />
          <h1 className="m-0 text-lg font-semibold tracking-[-0.02em]" style={{ color: "var(--text)" }}>
            Income
          </h1>
        </div>
        <Link
          to="/income/sources"
          className="flex items-center gap-1.5 py-1.5 px-[14px] rounded-md text-[12.5px] font-medium cursor-pointer no-underline"
          style={{
            background: `color-mix(in srgb, ${SECTION_ACCENT} 12%, transparent)`,
            border: `1px solid color-mix(in srgb, ${SECTION_ACCENT} 30%, transparent)`,
            color: SECTION_ACCENT,
          }}>
          <Plus size={13} />
          Add Source
        </Link>
      </div>

      {!!pageError && <InlineError error={pageError} />}

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="m-0 text-sm font-semibold" style={{ color: "var(--text)" }}>
            Income Sources
          </h2>
          <Link to="/income/sources" className="text-[11px] cursor-pointer no-underline" style={{ color: "var(--text-dim)" }}>
            Manage sources →
          </Link>
        </div>

        {sources.length === 0 ? (
          <EmptyState
            icon={<Wallet size={20} style={{ color: SECTION_ACCENT }} />}
            title="No income sources yet"
            description="Add your employment income to see totals here."
            accent={SECTION_ACCENT}
          />
        ) : (
          <div className="rounded-lg overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th className={thCls("left")} style={thCSS}>
                    Source
                  </th>
                  <th className={thCls("left")} style={thCSS}>
                    Owner
                  </th>
                  <th className={thCls("right")} style={thCSS}>
                    Annual
                  </th>
                </tr>
              </thead>
              <tbody>
                {sources.map((source) => {
                  const annual = source.frequency === "MONTHLY" ? source.amount * 12 : source.amount;
                  return (
                    <tr key={source.id} style={{ borderTop: "1px solid var(--border)" }} className="hover:bg-[var(--surface-raised)]">
                      <td className="py-[10px] px-3">
                        <span className="font-medium" style={{ color: "var(--text)" }}>
                          {source.name}
                        </span>
                        {source.frequency === "MONTHLY" && (
                          <span className="text-[11px] ml-2" style={{ color: "var(--text-dim)" }}>
                            ({fmtCAD(source.amount)}/mo)
                          </span>
                        )}
                      </td>
                      <td className="py-[10px] px-3">
                        <OwnerBadge name={source.owner.name} />
                      </td>
                      <td className="py-[10px] px-3 text-right num" style={{ color: "var(--text)" }}>
                        {fmtCAD(annual)}
                      </td>
                    </tr>
                  );
                })}
                <tr style={{ borderTop: "2px solid var(--border)", background: "var(--surface-raised)" }}>
                  <td className="py-[10px] px-3 font-medium" style={{ color: "var(--text)" }}>
                    Total
                  </td>
                  <td className="py-[10px] px-3" />
                  <td className="py-[10px] px-3 text-right num font-medium" style={{ color: "var(--text)" }}>
                    {fmtCAD(totalAnnualIncome)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="m-0 text-sm font-semibold" style={{ color: "var(--text)" }}>
            Government Pension Projections
          </h2>
          <span className="text-[11px]" style={{ color: "var(--text-dim)" }}>
            Estimated, based on 2026 rates
          </span>
        </div>

        {!hasAnyBirthYear ? (
          <div
            className="py-8 px-6 rounded-lg text-center flex flex-col items-center gap-3"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div
              className="w-11 h-11 rounded-[10px] flex items-center justify-center"
              style={{ backgroundColor: `color-mix(in srgb, ${SECTION_ACCENT} 10%, transparent)` }}>
              <Wallet size={20} style={{ color: SECTION_ACCENT }} />
            </div>
            <div className="text-sm" style={{ color: "var(--text)" }}>
              Configure birth year in Settings to see pension projections
            </div>
            <Link
              // biome-ignore lint/suspicious/noExplicitAny: TanStack Router `to` requires registered routes; settings route not yet registered
              to={"/settings" as any}
              className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-md text-[12px] font-medium no-underline"
              style={{
                background: `color-mix(in srgb, ${SECTION_ACCENT} 12%, transparent)`,
                border: `1px solid color-mix(in srgb, ${SECTION_ACCENT} 30%, transparent)`,
                color: SECTION_ACCENT,
              }}>
              <Settings size={13} />
              Go to Settings
            </Link>
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}>
            {projections.map((proj) => {
              const personTotal = totalsByPerson.get(proj.person.id);
              return (
                <div
                  key={proj.person.id}
                  className="rounded-lg p-4 flex flex-col gap-3"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[13px]" style={{ color: "var(--text)" }}>
                      {proj.person.name}
                    </span>
                    {!proj.hasBirthYear && (
                      <Link
                        // biome-ignore lint/suspicious/noExplicitAny: TanStack Router `to` requires registered routes; settings route not yet registered
                        to={"/settings" as any}
                        className="text-[11px] flex items-center gap-1 no-underline"
                        style={{ color: SECTION_ACCENT }}>
                        <Settings size={11} />
                        Configure birth year
                      </Link>
                    )}
                  </div>

                  {proj.hasBirthYear && (
                    <>
                      <div className="text-[11px] flex gap-3" style={{ color: "var(--text-dim)" }}>
                        <span>Age: {proj.age}</span>
                        <span>Claim age: {proj.claimAge}</span>
                        {proj.yearsUntilClaim > 0 && <span>({proj.yearsUntilClaim} years until claim)</span>}
                      </div>

                      <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] uppercase tracking-[0.05em]" style={{ color: "var(--text-muted)" }}>
                            CPP Estimate
                          </span>
                          <div className="num text-[15px] font-medium" style={{ color: "var(--text)" }}>
                            {fmtCAD(proj.cpp.monthly)}
                            <span className="text-[11px] font-normal ml-1" style={{ color: "var(--text-dim)" }}>
                              /mo
                            </span>
                          </div>
                          <div className="num text-[11px]" style={{ color: "var(--text-muted)" }}>
                            {fmtCAD(proj.cpp.annual)}/yr
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] uppercase tracking-[0.05em]" style={{ color: "var(--text-muted)" }}>
                            OAS Estimate
                          </span>
                          <div className="num text-[15px] font-medium" style={{ color: "var(--text)" }}>
                            {fmtCAD(proj.oas.monthly)}
                            <span className="text-[11px] font-normal ml-1" style={{ color: "var(--text-dim)" }}>
                              /mo
                            </span>
                          </div>
                          <div className="num text-[11px]" style={{ color: "var(--text-muted)" }}>
                            {fmtCAD(proj.oas.annual)}/yr
                          </div>
                          {proj.oas.residenceYears < 40 && (
                            <div className="text-[10px]" style={{ color: "var(--text-dim)" }}>
                              {proj.oas.residenceYears}/40 residence years
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between py-2 px-2 rounded" style={{ background: "var(--surface-raised)", marginTop: 4 }}>
                        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                          Total at {proj.claimAge}
                        </span>
                        <span className="num text-[12px] font-medium" style={{ color: "var(--text)" }}>
                          {fmtCAD(proj.cpp.annual + proj.oas.annual + (personTotal?.annual ?? 0))}/yr
                        </span>
                      </div>

                      <div className="text-[10px] flex gap-4" style={{ color: "var(--text-dim)" }}>
                        <span>Pre-tax amounts</span>
                        <span>CPP at {proj.claimAge} (est. 70% of max)</span>
                      </div>

                      {proj.isOver75 && (
                        <div className="text-[10px] px-2 py-1 rounded" style={{ background: "var(--surface-raised)", color: "var(--text-muted)" }}>
                          Age 75+ OAS bump applied (+10%)
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
