interface Props {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function SeatStepper({ id, label, value, onChange, min = 1, max = 500, disabled }: Props) {
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n) || min));

  return (
    <div className="field">
      <label htmlFor={id} className="field-label">{label}</label>
      <div className="stepper">
        <button
          type="button"
          className="btn btn-secondary stepper-btn"
          aria-label="Remove one seat"
          disabled={disabled || value <= min}
          onClick={() => onChange(clamp(value - 1))}
        >
          -
        </button>
        <input
          id={id}
          className="input stepper-input"
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
        />
        <button
          type="button"
          className="btn btn-secondary stepper-btn"
          aria-label="Add one seat"
          disabled={disabled || value >= max}
          onClick={() => onChange(clamp(value + 1))}
        >
          +
        </button>
      </div>
    </div>
  );
}
