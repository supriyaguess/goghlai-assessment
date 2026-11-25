import { useState } from 'react';
import { PaymentError, cancelSubscription, changeSeats, money, seatLabel, totalLine, type Billing } from '../../billing';
import { errorText } from '../../api';
import { useToast } from '../Toasts';
import { SeatStepper } from './SeatStepper';

interface Props {
  workspace: string;
  billing: Billing;
  onBilling: (next: Billing) => void;
}

export function ManageSeats({ workspace, billing, onBilling }: Props) {
  const toast = useToast();
  const [seats, setSeats] = useState(billing.seats);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [seatError, setSeatError] = useState<string | null>(null);

  const price = billing.priceCentsPerSeat;
  const unchanged = seats === billing.seats;
  const difference = seats - billing.seats;

  async function updateSeats() {
    if (busy || unchanged) return;
    setBusy(true);
    setWarning(null);
    setSeatError(null);
    try {
      const next = await changeSeats(workspace, seats);
      onBilling(next);
      setSeats(next.seats);
      setWarning(next.warning ?? null);
      toast.show(`Seats updated. You now pay ${money(next.seats * price)} per month.`);
    } catch (err) {
      if (err instanceof PaymentError) {
        setSeatError(`The extra charge did not go through, so your seats were not changed. ${err.message}`);
        toast.show('The extra charge failed. Your seats were not changed.', 'error');
      } else {
        toast.show(errorText(err), 'error');
      }
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (busy) return;
    setBusy(true);
    try {
      const next = await cancelSubscription(workspace);
      onBilling(next);
      setConfirming(false);
      toast.show('Cancellation scheduled.');
    } catch (err) {
      toast.show(errorText(err), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bill-card" aria-labelledby="bill-manage">
      <h2 id="bill-manage" className="bill-title">Manage seats</h2>
      <div className="bill-form">
        <SeatStepper id="manage-seats" label="Number of seats" value={seats} onChange={setSeats} disabled={busy} />
        <p className="bill-total" aria-live="polite">
          {totalLine(seats, price)}
          {!unchanged && difference > 0 && ` (you are charged the difference for the rest of this month now)`}
          {!unchanged && difference < 0 && ` (the unused amount is credited to your next invoice, not refunded)`}
        </p>
        <div>
          <button className="btn btn-primary" type="button" onClick={updateSeats} disabled={busy || unchanged}>
            {busy && !confirming ? 'Updating...' : 'Update seats'}
          </button>
        </div>
        {seatError && <p className="notice notice-danger" role="alert">{seatError}</p>}
        {warning && <p className="notice notice-warning" role="status">{warning}</p>}
      </div>

      <div className="bill-divider" />
      <h3 className="bill-sub">Cancel subscription</h3>
      {confirming ? (
        <div className="notice notice-danger" role="group" aria-label="Confirm cancellation">
          <p>
            Cancel the subscription for {seatLabel(billing.seats)} at the end of the current period? After that,
            your team can read the inbox but cannot send messages.
          </p>
          <div className="bill-actions">
            <button className="btn btn-danger" type="button" onClick={cancel} disabled={busy}>
              {busy ? 'Canceling...' : 'Yes, cancel at period end'}
            </button>
            <button className="btn btn-secondary" type="button" onClick={() => setConfirming(false)} disabled={busy}>
              Keep subscription
            </button>
          </div>
        </div>
      ) : (
        <button className="btn btn-secondary" type="button" onClick={() => setConfirming(true)}>
          Cancel at period end
        </button>
      )}
    </section>
  );
}
