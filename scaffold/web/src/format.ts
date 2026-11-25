const DAY = 86_400_000;

export function relativeTime(iso: string, now = Date.now()) {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString();
}

export function clockTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function startOfDay(time: number) {
  const d = new Date(time);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function sameDay(a: string, b: string) {
  return startOfDay(new Date(a).getTime()) === startOfDay(new Date(b).getTime());
}

export function dayLabel(iso: string, now = Date.now()) {
  const date = new Date(iso);
  const diff = Math.round((startOfDay(now) - startOfDay(date.getTime())) / DAY);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function listTime(iso: string, now = Date.now()) {
  const elapsed = now - new Date(iso).getTime();
  if (elapsed < DAY) return relativeTime(iso, now);
  const diff = Math.round((startOfDay(now) - startOfDay(new Date(iso).getTime())) / DAY);
  if (diff === 1) return 'Yesterday';
  const date = new Date(iso);
  if (diff < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatPhone(raw: string) {
  const us = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(raw);
  if (us) return `+1 (${us[1]}) ${us[2]}-${us[3]}`;
  const digits = /^\+?(\d{6,})$/.exec(raw);
  if (digits) return `+${digits[1].replace(/(\d{3})(?=\d)/g, '$1 ')}`;
  return raw;
}

export function initials(label: string) {
  const words = label.trim().split(/\s+/).filter((w) => /[a-z]/i.test(w));
  if (words.length === 0) return label.replace(/\D/g, '').slice(-2) || '?';
  return words
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

export function avatarIndex(seed: string) {
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) hash = (hash * 33 + seed.charCodeAt(i)) >>> 0;
  return hash % 8;
}

export function workspaceName(id: string) {
  const name = id.replace(/^ws_/, '');
  return name.charAt(0).toUpperCase() + name.slice(1);
}
