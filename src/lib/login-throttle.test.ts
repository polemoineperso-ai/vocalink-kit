import { describe, it, expect } from "vitest";
import { formatWait, lockUntil, minutesLeft } from "@/lib/login-throttle";

const now = new Date("2026-10-24T10:00:00Z");
const minutesAfter = (date: Date | null) => (date ? (date.getTime() - now.getTime()) / 60_000 : null);

describe("lockUntil", () => {
  it("laisse essayer jusqu'à 4 échecs", () => {
    for (let failures = 0; failures < 5; failures++) expect(lockUntil(failures, now)).toBeNull();
  });

  it("bloque 15 minutes au 5e échec, puis double à chaque série", () => {
    expect(minutesAfter(lockUntil(5, now))).toBe(15);
    expect(lockUntil(6, now)).toBeNull();
    expect(minutesAfter(lockUntil(10, now))).toBe(30);
    expect(minutesAfter(lockUntil(15, now))).toBe(60);
  });

  it("ne bloque jamais plus de 24 heures", () => {
    expect(minutesAfter(lockUntil(100, now))).toBe(24 * 60);
  });
});

describe("minutesLeft", () => {
  it("arrondit au-dessus et s'arrête à zéro", () => {
    expect(minutesLeft(new Date(now.getTime() + 61_000), now)).toBe(2);
    expect(minutesLeft(new Date(now.getTime() - 1000), now)).toBe(0);
    expect(minutesLeft(null, now)).toBe(0);
  });
});

describe("formatWait", () => {
  it("parle en minutes, puis en heures", () => {
    expect(formatWait(15)).toBe("15 min");
    expect(formatWait(60)).toBe("1 h");
    expect(formatWait(90)).toBe("1 h 30 min");
  });
});
