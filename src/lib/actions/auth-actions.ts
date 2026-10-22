"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { computeSessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 jours

export async function login(formData: FormData): Promise<void> {
  const password = formData.get("password");
  const next = (formData.get("next") as string) || "/";
  const expected = process.env.APP_PASSWORD;

  if (!expected || password !== expected) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
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
