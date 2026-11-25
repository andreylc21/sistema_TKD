import { describe, expect, it } from "vitest";
import { addMinutes, hourLabel, hourOptions, minuteOptions } from "./time";

describe("time", () => {
  it("propone una hora después de la hora de inicio", () => {
    expect(addMinutes("16:00", 60)).toBe("17:00");
    expect(addMinutes("16:45", 60)).toBe("17:45");
    expect(addMinutes("23:30", 60)).toBe("23:55");
  });

  it("muestra las horas en formato de 12 horas", () => {
    expect(hourLabel(16)).toBe("4 p. m.");
    expect(hourLabel(9)).toBe("9 a. m.");
    expect(hourLabel(12)).toBe("12 p. m.");
  });

  it("ofrece minutos de 5 en 5 y conserva un valor antiguo", () => {
    expect(minuteOptions(0)).toHaveLength(12);
    expect(minuteOptions(0)).not.toContain(17);
    expect(minuteOptions(17)).toContain(17);
    expect(hourOptions(7)).toContain(7);
    expect(hourOptions(3)).toContain(3);
  });
});
