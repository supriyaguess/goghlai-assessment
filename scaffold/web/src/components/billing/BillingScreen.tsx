import { useEffect, useRef } from 'react';
import type { BillingState } from '../../billing';
import { ManageSeats } from './ManageSeats';
import { StatusSummary } from './StatusSummary';
import { SubscribeForm } from './SubscribeForm';

interface Props {
  workspace: string;
  isAdmin: boolean;
  state: BillingState;
}

export function BillingScreen({ workspace, isAdmin, state }: Props) {
  const { billing, loading, failed, refresh, replace } = state;
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <main className="billing" aria-labelledby="billing-title">
      <div className="billing-inner">
        <h1 id="billing-title" className="billing-h1" tabIndex={-1} ref={heading}>Billing</h1>
        {!isAdmin ? (
          <p className="notice notice-neutral" role="status">Only admins can manage billing.</p>
        ) : loading && !billing ? (
          <p className="empty" role="status">Loading billing...</p>
        ) : !billing ? (
          <div className="empty" role="alert">
            <p>Could not load billing details.</p>
            <button className="btn btn-secondary" onClick={refresh}>Try again</button>
          </div>
        ) : (
          <>
            {failed && <p className="notice notice-warning" role="status">Could not refresh. Showing the last known state.</p>}
            {billing.status === 'incomplete' && billing.nextActionUrl && (
              <div className="notice notice-warning bank-banner" role="status">
                <div>
                  <strong>Your bank needs to approve this payment</strong>
                  <p>Approve it at your bank. This page updates by itself once the payment goes through.</p>
                </div>
                <a className="btn btn-primary" href={billing.nextActionUrl}>Approve at your bank</a>
              </div>
            )}
            <StatusSummary billing={billing} />
            {(billing.status === 'none' || billing.status === 'incomplete' || billing.status === 'canceled') && (
              <SubscribeForm
                key={billing.status}
                workspace={workspace}
                billing={billing}
                onBilling={replace}
                onRefresh={refresh}
              />
            )}
            {(billing.status === 'active' || billing.status === 'past_due') && (
              <ManageSeats workspace={workspace} billing={billing} onBilling={replace} />
            )}
          </>
        )}
      </div>
    </main>
  );
}
