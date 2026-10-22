"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { computeSessionToken, SESSION_COOKIE_NAME } from "@/lib/session";
import { safeNextPath } from "@/lib/safe-next";
import { lockUntil, minutesLeft } from "@/lib/login-throttle";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 jours
const SETTINGS_ID = 1;

/** Comparaison en temps constant : la durée ne trahit rien du mot de passe. */
function samePassword(given: string, expected: string): boolean {
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(given), digest(expected));
}

export async function login(formData: FormData): Promise<void> {
  const password = formData.get("password");
  const next = safeNextPath(formData.get("next"));
  const expected = process.env.APP_PASSWORD;
  const back = `next=${encodeURIComponent(next)}`;
  if (!expected) redirect(`/login?error=1&${back}`);

  // Blocage en cours : on ne vérifie même pas le mot de passe.
  const now = new Date();
  const settings = await prisma.settings.findUnique({ where: { id: SETTINGS_ID } });
  const wait = minutesLeft(settings?.loginBlockedUntil ?? null, now);
  if (wait > 0) redirect(`/login?attente=${wait}&${back}`);

  if (typeof password !== "string" || !samePassword(password, expected)) {
    const failures = (settings?.loginFailures ?? 0) + 1;
    const blockedUntil = lockUntil(failures, now);
    await prisma.settings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, loginFailures: failures, loginBlockedUntil: blockedUntil },
      update: { loginFailures: failures, ...(blockedUntil ? { loginBlockedUntil: blockedUntil } : {}) },
    });
    if (blockedUntil) redirect(`/login?attente=${minutesLeft(blockedUntil, now)}&${back}`);
    redirect(`/login?error=1&${back}`);
  }

  if (settings?.loginFailures || settings?.loginBlockedUntil) {
    await prisma.settings.update({ where: { id: SETTINGS_ID }, data: { loginFailures: 0, loginBlockedUntil: null } });
  }

  const token = await computeSessionToken(expected);
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  redirect(next);
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
