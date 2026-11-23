import { getT } from "@/lib/i18n/server";
import { EVENT } from "@/lib/event";
import { Alert, Card, PageHeader } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";

// Lima: the portal does not take service requests itself. This page explains what can be booked
// and opens the Host Broadcaster's booking site, where right holders sign in with their booking account.
export async function BookingGateway() {
  const { t } = await getT();
  const services = ["standups", "observer", "offtube", "circuits", "connectivity", "mam", "tailor"];
  return (
    <div className="stack">
      <PageHeader title={t("booking.title")} subtitle={t("booking.subtitle")} />
      <Card>
        <div className="stack">
          <p style={{ margin: 0 }}>{t("booking.intro")}</p>
          <div>
            <a className="btn btn-primary" href={EVENT.bookingUrl} target="_blank" rel="noopener noreferrer">
              <Icon name="inbox" /> {t("booking.open")}
            </a>
          </div>
          <p className="muted small" style={{ margin: 0 }}>{t("booking.login")}</p>
        </div>
      </Card>
      <div className="grid grid-2">
        <Card title={t("booking.whatTitle")}>
          <ul className="stack-sm" style={{ margin: 0, paddingLeft: "1.2em" }}>
            {services.map((s) => <li key={s}>{t(`booking.services.${s}`)}</li>)}
          </ul>
        </Card>
        <Card title={t("booking.howTitle")}>
          <ol className="stack-sm" style={{ margin: 0, paddingLeft: "1.2em" }}>
            <li>{t("booking.how1")}</li>
            <li>{t("booking.how2")}</li>
            <li>{t("booking.how3")}</li>
          </ol>
        </Card>
      </div>
      <Alert tone="info">{t("booking.rules")}</Alert>
    </div>
  );
}
