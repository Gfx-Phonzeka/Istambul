import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { requireCrew } from "@/lib/crew-server";
import { getT } from "@/lib/i18n/server";
import { crewLabels } from "@/lib/crew";
import { loadPlan } from "@/lib/crew-days";
import { addUnit, deleteUnit } from "@/lib/actions/crew";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { CrewTabs } from "@/components/crew/CrewTabs";
import { CrewForm } from "@/components/crew/CrewForm";

export const metadata = { title: "Crew Ops · Units" };

export default async function CrewUnitsPage() {
  const me = await requireCrew();
  const { locale } = await getT();
  const c = crewLabels(locale);
  const plan = await loadPlan();
  return (
    <div className="stack">
      <PageHeader title={c("crewOps")} subtitle={c("unitsIntro")} />
      <CrewTabs active="units" c={c} admin={isAdmin(me)} />
      <Card title={c("addUnit")}>
        <CrewForm action={addUnit} saved={c("saved")} error={c("error")}>
          <input name="code" className="input" placeholder={c("unitCode")} aria-label={c("unitCode")} required maxLength={40} />
          <input name="name" className="input" placeholder={c("unitName")} aria-label={c("unitName")} maxLength={120} />
          <select name="size" className="input" aria-label={c("size")} defaultValue=""><option value="">{c("size")}</option>{["XL", "L", "M", "S"].map((s) => <option key={s}>{s}</option>)}</select>
          <select name="mode" className="input" aria-label={c("mode")} defaultValue=""><option value="">{c("mode")}</option>{["OB", "REMI", "REMOTE", "FLYPACK"].map((s) => <option key={s}>{s}</option>)}</select>
          <input name="cameras" type="number" min={0} max={99} className="input" placeholder={c("cameras")} aria-label={c("cameras")} style={{ maxWidth: 120 }} />
          <button className="btn btn-sm btn-primary">{c("addUnit")}</button>
        </CrewForm>
      </Card>
      <Card title={`${c("tabUnits")} (${plan.units.length})`}>
        {plan.units.length === 0 ? <EmptyState icon="broadcast">{c("noUnits")}</EmptyState> : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>{c("unit")}</th><th>{c("size")} · {c("mode")} · {c("cameras")}</th><th>{c("plan")}</th><th>{c("assignments")}</th><th /></tr></thead>
              <tbody>
                {plan.units.map((u) => {
                  const days = plan.unitDays.filter((d) => d.unit_id === u.id).map((d) => d.day);
                  return (
                    <tr key={u.id}>
                      <td><Link href={`/team/crew/units/${u.id}`}><strong>{u.code}</strong></Link>{u.name ? <div className="muted small">{u.name}</div> : null}</td>
                      <td className="small">{[u.size, u.mode, u.cameras != null ? `${u.cameras} cam` : null].filter(Boolean).join(" · ") || "—"}</td>
                      <td className="small">{days.length ? `${days[0]} → ${days[days.length - 1]} (${days.length} ${c("days")})` : "—"}</td>
                      <td className="small">{plan.assignments.filter((a) => a.unit_id === u.id).length}</td>
                      <td className="row" style={{ gap: 6 }}>
                        <Link className="btn btn-sm" href={`/team/crew/units/${u.id}`}>{c("edit")}</Link>
                        <ConfirmButton className="btn btn-sm" message={c("confirmDeleteUnit")} confirmLabel={c("delete")} onConfirm={deleteUnit.bind(null, u.id)}>{c("delete")}</ConfirmButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
