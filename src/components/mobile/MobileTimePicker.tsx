interface TimePickerProps {
  value: string; // "14:30"
  onChange: (value: string) => void;
  label: string;
}

export function TimePicker({ value, onChange, label }: TimePickerProps) {
  const [hour, minute] = value.split(':').map(Number);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        <select
          value={hour}
          onChange={(e) => onChange(`${e.target.value.padStart(2, '0')}:${String(minute).padStart(2, '0')}`)}
          className="flex-1 rounded-lg border p-3 text-center text-lg font-bold"
        >
          {hours.map((h) => (
            <option key={h} value={h}>
              {String(h).padStart(2, '0')}
            </option>
          ))}
        </select>
        <span className="flex items-center text-2xl font-bold">:</span>
        <select
          value={minute}
          onChange={(e) => onChange(`${String(hour).padStart(2, '0')}:${e.target.value.padStart(2, '0')}`)}
          className="flex-1 rounded-lg border p-3 text-center text-lg font-bold"
        >
          {minutes.map((m) => (
            <option key={m} value={m}>
              {String(m).padStart(2, '0')}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

interface DurationPickerProps {
  value: number; // hours as decimal (1.5 = 1h 30m)
  onChange: (value: number) => void;
  label: string;
}

export function DurationPicker({ value, onChange, label }: DurationPickerProps) {
  const hours = Math.floor(value);
  const minutes = Math.round((value - hours) * 60);

  const hourOptions = Array.from({ length: 6 }, (_, i) => i); // 0-5h
  const minuteOptions = [0, 15, 30, 45];

  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        <select
          value={hours}
          onChange={(e) => onChange(Number(e.target.value) + minutes / 60)}
          className="flex-1 rounded-lg border p-3 text-center text-lg font-bold"
        >
          {hourOptions.map((h) => (
            <option key={h} value={h}>
              {h}h
            </option>
          ))}
        </select>
        <select
          value={minutes}
          onChange={(e) => onChange(hours + Number(e.target.value) / 60)}
          className="flex-1 rounded-lg border p-3 text-center text-lg font-bold"
        >
          {minuteOptions.map((m) => (
            <option key={m} value={m}>
              {m}m
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
