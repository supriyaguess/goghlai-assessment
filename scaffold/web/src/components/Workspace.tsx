import { useState } from 'react';
import { useSocket } from '../useSocket';
import type { Me } from '../types';
import { Inbox } from './Inbox';
import { Thread } from './Thread';
import { Banner } from './Banner';

interface Props {
  me: Me;
  workspace: string;
  isAdmin: boolean;
}

export function Workspace({ me, workspace, isAdmin }: Props) {
  const { connected, epoch, subscribe } = useSocket(workspace);
  const [contact, setContact] = useState<string | null>(null);

  return (
    <>
      {!connected && <Banner tone="info">Live updates are reconnecting...</Banner>}
      <div className="columns">
        <Inbox me={me} workspace={workspace} selected={contact} onSelect={setContact} subscribe={subscribe} epoch={epoch} />
        {contact ? (
          <Thread
            key={contact}
            me={me}
            workspace={workspace}
            contact={contact}
            isAdmin={isAdmin}
            subscribe={subscribe}
            epoch={epoch}
          />
        ) : (
          <section className="thread empty" aria-label="Conversation">
            <p>Select a conversation to read it.</p>
          </section>
        )}
      </div>
    </>
  );
}
