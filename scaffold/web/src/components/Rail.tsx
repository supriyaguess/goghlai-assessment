import { useEffect, useRef, useState } from 'react';
import { workspaceName } from '../format';
import type { Me } from '../types';
import type { Filter } from './Inbox';
import { Avatar } from './Avatar';
import { BrandMark, CardIcon, InboxIcon, UserIcon } from './icons';

interface Props {
  me: Me;
  workspaces: Me['workspaces'];
  workspace: string;
  isAdmin: boolean;
  view: 'inbox' | 'billing';
  onBilling: () => void;
  onWorkspace: (id: string) => void;
  filter: Filter;
  onFilter: (filter: Filter) => void;
  connected: boolean;
  onSignOut: () => void;
}

function useOnline() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return online;
}

export function Rail({ me, workspaces, workspace, isAdmin, view, onBilling, onWorkspace, filter, onFilter, connected, onSignOut }: Props) {
  const online = useOnline();
  const status = !online ? 'offline' : connected ? 'live' : 'reconnecting';
  const statusText = { live: 'Live', reconnecting: 'Reconnecting...', offline: 'Offline' }[status];

  return (
    <nav className="rail" aria-label="Workspace">
      <div className="rail-brand"><BrandMark size={32} /></div>
      <div className="rail-group">
        <button
          className="rail-btn"
          aria-label="Inbox"
          title="Inbox"
          aria-current={view === 'inbox' && filter !== 'mine' ? 'page' : undefined}
          onClick={() => onFilter('open')}
        >
          <InboxIcon size={20} />
        </button>
        <button
          className="rail-btn"
          aria-label="Mine"
          title="Assigned to me"
          aria-current={view === 'inbox' && filter === 'mine' ? 'page' : undefined}
          onClick={() => onFilter('mine')}
        >
          <UserIcon size={20} />
        </button>
        {isAdmin && (
          <button
            className="rail-btn"
            aria-label="Billing"
            title="Billing"
            aria-current={view === 'billing' ? 'page' : undefined}
            onClick={onBilling}
          >
            <CardIcon size={20} />
          </button>
        )}
      </div>
      <div className="rail-group rail-workspaces" role="group" aria-label="Workspaces">
        {workspaces.map((w) => (
          <button
            key={w.id}
            className="rail-btn rail-ws"
            aria-pressed={w.id === workspace}
            aria-label={workspaceName(w.id)}
            title={workspaceName(w.id)}
            onClick={() => onWorkspace(w.id)}
          >
            {workspaceName(w.id).charAt(0)}
          </button>
        ))}
      </div>
      <div className="rail-bottom">
        <span className={`conn conn-${status}`} role="img" aria-label={`Connection: ${statusText}`} title={statusText} />
        <UserMenu me={me} isAdmin={isAdmin} onBilling={onBilling} onSignOut={onSignOut} />
      </div>
    </nav>
  );
}

function UserMenu({ me, isAdmin, onBilling, onSignOut }: { me: Me; isAdmin: boolean; onBilling: () => void; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="user-menu" ref={root}>
      <button
        className="rail-avatar"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Avatar label={me.name} seed={me.sub} size={32} />
      </button>
      {open && (
        <div className="menu" role="menu">
          <div className="menu-head">
            <strong>{me.name}</strong>
            <span>{me.email}</span>
          </div>
          {isAdmin && (
            <button
              className="menu-item"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onBilling();
              }}
            >
              Billing
            </button>
          )}
          <button className="menu-item" role="menuitem" onClick={onSignOut}>Sign out</button>
        </div>
      )}
    </div>
  );
}
