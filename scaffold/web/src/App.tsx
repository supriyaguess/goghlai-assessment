import { useEffect, useState } from 'react';
import { ApiError, get, post } from './api';
import type { Me } from './types';
import { SignIn } from './components/SignIn';
import { ToastProvider } from './components/Toasts';
import { Workspace } from './components/Workspace';

const STORAGE_KEY = 'switchboard.workspace';

type Session = { state: 'loading' } | { state: 'out' } | { state: 'error' } | { state: 'in'; me: Me };

function pickWorkspace(me: Me) {
  const saved = localStorage.getItem(STORAGE_KEY);
  const known = me.workspaces.find((w) => w.id === saved);
  return (known ?? me.workspaces[0])?.id ?? null;
}

export function App() {
  const [session, setSession] = useState<Session>({ state: 'loading' });
  const [workspace, setWorkspace] = useState<string | null>(null);

  useEffect(() => {
    get<Me>('/api/me')
      .then((me) => {
        setWorkspace(pickWorkspace(me));
        setSession({ state: 'in', me });
      })
      .catch((err) => setSession({ state: err instanceof ApiError && err.status === 401 ? 'out' : 'error' }));
  }, []);

  function chooseWorkspace(id: string) {
    localStorage.setItem(STORAGE_KEY, id);
    setWorkspace(id);
  }

  async function signOut() {
    try {
      await post('/auth/logout', {});
    } finally {
      setSession({ state: 'out' });
    }
  }

  if (session.state === 'loading') return <p className="loader" role="status">Loading...</p>;
  if (session.state === 'out') return <SignIn />;
  if (session.state === 'error') {
    return (
      <main className="centered">
        <p>Could not reach the server.</p>
        <button className="btn btn-secondary" onClick={() => location.reload()}>Try again</button>
      </main>
    );
  }

  const { me } = session;
  const current = me.workspaces.find((w) => w.id === workspace);

  return (
    <ToastProvider>
      {current ? (
        <Workspace
          key={current.id}
          me={me}
          workspaces={me.workspaces}
          workspace={current.id}
          isAdmin={current.role === 'admin'}
          onWorkspace={chooseWorkspace}
          onSignOut={signOut}
        />
      ) : (
        <main className="centered">
          <p>Your account is not a member of any workspace.</p>
          <button className="btn btn-secondary" onClick={signOut}>Sign out</button>
        </main>
      )}
    </ToastProvider>
  );
}
