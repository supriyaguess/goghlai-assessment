import type { Me } from '../types';

interface Props {
  me: Me;
  workspace: string | null;
  onWorkspace: (id: string) => void;
  onSignOut: () => void;
}

export function TopBar({ me, workspace, onWorkspace, onSignOut }: Props) {
  return (
    <header className="topbar">
      <strong className="brand">Switchboard</strong>
      {me.workspaces.length > 1 && (
        <label className="inline-field">
          Workspace
          <select value={workspace ?? ''} onChange={(e) => onWorkspace(e.target.value)}>
            {me.workspaces.map((w) => (
              <option key={w.id} value={w.id}>{w.id}</option>
            ))}
          </select>
        </label>
      )}
      <span className="spacer" />
      <span className="user">{me.name}</span>
      <button onClick={onSignOut}>Sign out</button>
    </header>
  );
}
