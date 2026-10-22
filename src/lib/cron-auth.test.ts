import { afterEach, describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { isAuthorizedCronCall } from "@/lib/cron-auth";

const call = (headers: Record<string, string> = {}, query = "") =>
  new NextRequest(`https://vocalink.test/api/cron/brief${query}`, { headers });
const at = (hourUtc: number) => new Date(Date.UTC(2026, 9, 24, hourUtc, 30));

afterEach(() => {
  delete process.env.CRON_SECRET;
});

describe("isAuthorizedCronCall avec CRON_SECRET", () => {
  it("accepte le secret en en-tête (Vercel Cron ou appel manuel)", () => {
    process.env.CRON_SECRET = "s3cret";
    expect(isAuthorizedCronCall(call({ authorization: "Bearer s3cret" }))).toBe(true);
    expect(isAuthorizedCronCall(call({ "x-cron-secret": "s3cret" }))).toBe(true);
  });

  it("refuse un mauvais secret, et le secret dans l'adresse", () => {
    process.env.CRON_SECRET = "s3cret";
    expect(isAuthorizedCronCall(call({ authorization: "Bearer autre" }))).toBe(false);
    expect(isAuthorizedCronCall(call({}, "?secret=s3cret"))).toBe(false);
  });
});

describe("isAuthorizedCronCall sans CRON_SECRET (installations du kit)", () => {
  const vercel = { "x-vercel-cron-schedule": "0 6 * * *" };

  it("accepte Vercel Cron dans son créneau seulement", () => {
    expect(isAuthorizedCronCall(call(vercel), { vercelCronWindowUtc: [6, 8], now: at(6) })).toBe(true);
    expect(isAuthorizedCronCall(call(vercel), { vercelCronWindowUtc: [6, 8], now: at(7) })).toBe(true);
    expect(isAuthorizedCronCall(call(vercel), { vercelCronWindowUtc: [6, 8], now: at(3) })).toBe(false);
    expect(isAuthorizedCronCall(call(vercel), { vercelCronWindowUtc: [6, 8], now: at(8) })).toBe(false);
  });

  it("refuse tout le reste", () => {
    expect(isAuthorizedCronCall(call(), { vercelCronWindowUtc: [6, 8], now: at(6) })).toBe(false);
    expect(isAuthorizedCronCall(call(vercel), { now: at(6) })).toBe(false);
  });
});
