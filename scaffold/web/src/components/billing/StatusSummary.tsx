import { money, seatLabel, type Billing, type BillingStatus } from '../../billing';

const PILLS: Record<BillingStatus, { text: string; tone: string }> = {
  none: { text: 'Free trial', tone: 'neutral' },
  active: { text: 'Active', tone: 'success' },
  past_due: { text: 'Past due', tone: 'warning' },
  incomplete: { text: 'Waiting for payment', tone: 'warning' },
  canceled: { text: 'Canceled', tone: 'danger' },
};

export function StatusSummary({ billing }: { billing: Billing }) {
  const pill = PILLS[billing.status];
  const subscribed = billing.status !== 'none' && billing.status !== 'canceled';
  const monthly = billing.seats * billing.priceCentsPerSeat;

  return (
    <section className="bill-card" aria-labelledby="bill-state">
      <div className="bill-head">
        <h2 id="bill-state" className="bill-title">Subscription</h2>
        <span className={`pill pill-${pill.tone}`}>{pill.text}</span>
      </div>
      <p className="bill-state-text">{billing.plainState}</p>
      <dl className="bill-facts">
        <div>
          <dt>Seats</dt>
          <dd>{subscribed ? seatLabel(billing.seats) : 'None yet'}</dd>
        </div>
        <div>
          <dt>Monthly cost</dt>
          <dd>{subscribed ? money(monthly) : money(0)}</dd>
        </div>
        <div>
          <dt>Price per seat</dt>
          <dd>{money(billing.priceCentsPerSeat)} per month</dd>
        </div>
      </dl>
      {billing.nextStep && (
        <div className="bill-next">
          <strong>What to do next</strong>
          <p>{billing.nextStep}</p>
        </div>
      )}
    </section>
  );
}
