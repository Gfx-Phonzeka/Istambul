import { isAdmin } from "@/lib/auth";
import { requireCrew } from "@/lib/crew-server";
import { loadCrew } from "@/lib/crew-data";
import { getT } from "@/lib/i18n/server";
import { crewDict, crewLabels } from "@/lib/crew";
import { Card, PageHeader } from "@/components/ui";
import { CrewTabs } from "@/components/crew/CrewTabs";
import { AddFunctionForm, FunctionToggle } from "@/components/crew/CrewAdminForms";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { deleteFunction } from "@/lib/actions/crew";

export const metadata = { title: "Crew Ops · Functions" };

export default async function CrewFunctionsPage() {
  const me = await requireCrew();
  const { locale } = await getT();
  const c = crewLabels(locale);
  const { people, functions, fname } = await loadCrew(locale);
  const areas = [...new Set(functions.map((f) => f.area))];
  return (
    <div className="stack">
      <PageHeader title={c("crewOps")} subtitle={c("crewIntro")} />
      <CrewTabs active="functions" c={c} admin={isAdmin(me)} />
      <Card title={c("addFunction")}><AddFunctionForm L={crewDict(locale)} areas={areas} /></Card>
      {areas.map((a) => (
        <Card key={a} title={a}>
          <div className="crew-fn-list">
            {functions.filter((f) => f.area === a).map((f) => {
              const n = people.filter((p) => p.function_id === f.id).length;
              return (
                <div key={f.id} className="crew-fn">
                  <FunctionToggle id={f.id} active={f.active} label={fname(f) ?? f.name_en} />
                  <span className="row" style={{ gap: 6 }}>
                    {n > 0 && <span className="badge">{n}</span>}
                    <ConfirmButton className="btn btn-sm btn-ghost" message={c("confirmDeleteFunction")} confirmLabel={c("delete")} onConfirm={deleteFunction.bind(null, f.id)}>✕</ConfirmButton>
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}
