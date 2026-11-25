import { useState } from "react";
import {
  addMinutes,
  defaultClassMinutes,
  hourLabel,
  hourOptions,
  joinTime,
  minuteOptions,
  splitTime,
} from "../lib/time";

function TimeSelect({
  id,
  name,
  label,
  value,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [hour, minute] = splitTime(value);
  return (
    <div className="field">
      <label htmlFor={`${id}-hour`}>{label}</label>
      <input type="hidden" name={name} value={value} />
      <div className="time-select">
        <select
          id={`${id}-hour`}
          aria-label={`${label}: hora`}
          value={hour}
          onChange={(event) => onChange(joinTime(Number(event.target.value), minute))}
        >
          {hourOptions(hour).map((option) => (
            <option key={option} value={option}>
              {hourLabel(option)}
            </option>
          ))}
        </select>
        <span aria-hidden="true">:</span>
        <select
          aria-label={`${label}: minutos`}
          value={minute}
          onChange={(event) => onChange(joinTime(hour, Number(event.target.value)))}
        >
          {minuteOptions(minute).map((option) => (
            <option key={option} value={option}>
              {String(option).padStart(2, "0")}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/**
 * Inicio y fin de una clase. Al cambiar el inicio, el fin se mueve una hora después (como
 * 4 p. m. a 5 p. m.) mientras no se haya ajustado a mano.
 */
export function TimeRangeFields({
  idPrefix,
  startLabel,
  endLabel,
  initialStart,
  initialEnd,
}: {
  idPrefix: string;
  startLabel: string;
  endLabel: string;
  initialStart?: string;
  initialEnd?: string;
}) {
  const [start, setStart] = useState(initialStart || "16:00");
  const [end, setEnd] = useState(
    initialEnd || addMinutes(initialStart || "16:00", defaultClassMinutes),
  );
  const [endTouched, setEndTouched] = useState(Boolean(initialEnd));
  return (
    <>
      <TimeSelect
        id={`${idPrefix}-start`}
        name="start"
        label={startLabel}
        value={start}
        onChange={(value) => {
          setStart(value);
          if (!endTouched) setEnd(addMinutes(value, defaultClassMinutes));
        }}
      />
      <TimeSelect
        id={`${idPrefix}-end`}
        name="end"
        label={endLabel}
        value={end}
        onChange={(value) => {
          setEnd(value);
          setEndTouched(true);
        }}
      />
    </>
  );
}
