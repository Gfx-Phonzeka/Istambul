import { DAY_TYPES } from "@/lib/crew-days";

/** Period + day type selects shared by the unit plan and the per-person exceptions. */
export function PeriodFields({ c, extraTypes = [], defaultType = "live" }: { c: (k: string) => string; extraTypes?: string[]; defaultType?: string }) {
  return (
    <>
      <label className="crew-inline">{c("from")} <input name="from" type="date" className="input" required /></label>
      <label className="crew-inline">{c("to")} <input name="to" type="date" className="input" /></label>
      <select name="day_type" className="input" aria-label={c("dayType")} defaultValue={defaultType}>
        {DAY_TYPES.map((d) => <option key={d} value={d}>{c(`dayTypes_${d}`)}</option>)}
        {extraTypes.map((d) => <option key={d} value={d}>{d === "clear" ? c("clearDays") : c(`dayTypes_${d}`)}</option>)}
      </select>
    </>
  );
}
