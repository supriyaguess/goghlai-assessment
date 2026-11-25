import { avatarIndex, initials } from '../format';

interface Props {
  label: string;
  seed?: string;
  size: number;
}

export function Avatar({ label, seed = label, size }: Props) {
  return (
    <span
      className={`avatar avatar-${avatarIndex(seed)}`}
      style={{ width: size, height: size, fontSize: Math.max(9, Math.round(size * 0.38)) }}
      aria-hidden="true"
    >
      {initials(label)}
    </span>
  );
}
