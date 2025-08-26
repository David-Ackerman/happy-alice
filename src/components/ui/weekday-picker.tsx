import { Checkbox } from "./checkbox";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function WeekdayPicker({
  value,
  onChange,
  className,
}: {
  value: number[];
  onChange: (days: number[]) => void;
  className?: string;
}) {
  const toggle = (idx: number) => {
    if (value.includes(idx)) onChange(value.filter((d) => d !== idx));
    else onChange([...value, idx]);
  };

  return (
    <div className={className}>
      <div className="flex gap-2 flex-wrap">
        {WEEKDAYS.map((label, idx) => {
          const checked = value.includes(idx);
          return (
            <label
              key={label}
              className={`inline-flex items-center gap-2 px-2 py-1 rounded cursor-pointer select-none transition-colors ${
                checked ? "bg-primary/10" : "hover:bg-muted"
              }`}
            >
              <Checkbox
                checked={checked}
                onCheckedChange={() => toggle(idx)}
                aria-label={`Selecionar ${label}`}
              />
              <span className="text-sm">{label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default WeekdayPicker;
