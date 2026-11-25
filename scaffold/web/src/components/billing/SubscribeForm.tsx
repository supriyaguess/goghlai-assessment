import { useState, type FormEvent } from 'react';
import {
  PaymentError,
  formatCardNumber,
  formatExpiry,
  hasErrors,
  money,
  subscribe,
  tokenizeCard,
  totalLine,
  validateCard,
  digitsOnly,
  type Billing,
  type Card,
  type CardErrors,
} from '../../billing';
import { errorText } from '../../api';
import { useToast } from '../Toasts';
import { SeatStepper } from './SeatStepper';
import { TestCards } from './TestCards';

interface Props {
  workspace: string;
  billing: Billing;
  onBilling: (next: Billing) => void;
  onRefresh: () => void;
}

type Field = keyof Card;

export function SubscribeForm({ workspace, billing, onBilling, onRefresh }: Props) {
  const toast = useToast();
  const [seats, setSeats] = useState(Math.max(1, billing.seats));
  const [card, setCard] = useState<Card>({ number: '', expiry: '', cvc: '' });
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [busy, setBusy] = useState(false);

  const errors: CardErrors = validateCard(card);
  const shown = (f: Field) => (touched[f] ? errors[f] : undefined);
  const resubscribing = billing.status === 'canceled';

  function update(field: Field, value: string) {
    setCard((c) => ({ ...c, [field]: value }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (hasErrors(errors)) {
      setTouched({ number: true, expiry: true, cvc: true });
      return;
    }
    setBusy(true);
    try {
      const token = await tokenizeCard(billing.publishableKey, card);
      setCard({ number: '', expiry: '', cvc: '' });
      setTouched({});
      const next = await subscribe(workspace, seats, token);
      onBilling(next);
      toast.show('Payment received. Your subscription is active.');
    } catch (err) {
      if (err instanceof PaymentError) {
        if (err.nextActionUrl) {
          window.location.assign(err.nextActionUrl);
          return;
        }
        toast.show(err.message, 'error');
        onRefresh();
      } else {
        toast.show(errorText(err), 'error');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bill-card" aria-labelledby="bill-subscribe">
      <h2 id="bill-subscribe" className="bill-title">{resubscribing ? 'Resubscribe' : 'Subscribe'}</h2>
      <form onSubmit={submit} noValidate className="bill-form">
        <SeatStepper id="sub-seats" label="Number of seats" value={seats} onChange={setSeats} disabled={busy} />
        <p className="bill-total" aria-live="polite">{totalLine(seats, billing.priceCentsPerSeat)}</p>

        <div className="field">
          <label htmlFor="cc-number" className="field-label">Card number</label>
          <input
            id="cc-number"
            className="input"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="1234 1234 1234 1234"
            value={card.number}
            disabled={busy}
            aria-invalid={Boolean(shown('number'))}
            aria-describedby={shown('number') ? 'cc-number-err' : undefined}
            onChange={(e) => update('number', formatCardNumber(e.target.value))}
            onBlur={() => setTouched((t) => ({ ...t, number: true }))}
          />
          {shown('number') && <p id="cc-number-err" className="field-error">{errors.number}</p>}
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="cc-exp" className="field-label">Expiry (MM/YY)</label>
            <input
              id="cc-exp"
              className="input"
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM/YY"
              value={card.expiry}
              disabled={busy}
              aria-invalid={Boolean(shown('expiry'))}
              aria-describedby={shown('expiry') ? 'cc-exp-err' : undefined}
              onChange={(e) => update('expiry', formatExpiry(e.target.value))}
              onBlur={() => setTouched((t) => ({ ...t, expiry: true }))}
            />
            {shown('expiry') && <p id="cc-exp-err" className="field-error">{errors.expiry}</p>}
          </div>
          <div className="field">
            <label htmlFor="cc-csc" className="field-label">Security code</label>
            <input
              id="cc-csc"
              className="input"
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder="123"
              value={card.cvc}
              disabled={busy}
              aria-invalid={Boolean(shown('cvc'))}
              aria-describedby={shown('cvc') ? 'cc-csc-err' : undefined}
              onChange={(e) => update('cvc', digitsOnly(e.target.value).slice(0, 4))}
              onBlur={() => setTouched((t) => ({ ...t, cvc: true }))}
            />
            {shown('cvc') && <p id="cc-csc-err" className="field-error">{errors.cvc}</p>}
          </div>
        </div>

        <p className="bill-note">Card details go straight to the payment provider and never to our server.</p>

        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? 'Processing payment...' : `Pay ${money(seats * billing.priceCentsPerSeat)} per month`}
        </button>
      </form>
      <TestCards />
    </section>
  );
}
