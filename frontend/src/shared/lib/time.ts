/** Las clases se agendan de 5 en 5 minutos, de 8 a. m. a 10 p. m. */
export const minuteStep = 5;
export const firstHour = 8;
export const lastHour = 22;
export const defaultClassMinutes = 60;

const pad = (value: number) => String(value).padStart(2, "0");

export function splitTime(value: string): [number, number] {
  const [hour = firstHour, minute = 0] = value.split(":").map(Number);
  return [hour, minute];
}

export const joinTime = (hour: number, minute: number) => `${pad(hour)}:${pad(minute)}`;

/** Suma minutos sin pasar de las 23:55, para proponer la hora de fin al elegir el inicio. */
export function addMinutes(value: string, minutes: number) {
  const [hour, minute] = splitTime(value);
  const total = Math.min(hour * 60 + minute + minutes, 23 * 60 + 55);
  return joinTime(Math.floor(total / 60), total % 60);
}

/** "16" -> "4 p. m." */
export function hourLabel(hour: number) {
  const suffix = hour < 12 ? "a. m." : "p. m.";
  return `${hour % 12 || 12} ${suffix}`;
}

/** Minutos de 5 en 5; conserva uno ajeno al paso si un horario antiguo lo traía. */
export function minuteOptions(current: number) {
  const steps = Array.from({ length: 60 / minuteStep }, (_, index) => index * minuteStep);
  return steps.includes(current) ? steps : [...steps, current].sort((a, b) => a - b);
}

/** Horas disponibles; incluye la actual si queda fuera del horario habitual. */
export function hourOptions(current: number) {
  const hours = Array.from({ length: lastHour - firstHour + 1 }, (_, index) => firstHour + index);
  return hours.includes(current) ? hours : [...hours, current].sort((a, b) => a - b);
}
