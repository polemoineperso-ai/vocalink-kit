"use server";

import { prisma } from "@/lib/prisma";
import { getVapidKeys, sendPushToAll } from "@/lib/push";

/**
 * Réglages de l'installation (prénom, premier lancement) et abonnements aux
 * notifications. Une seule ligne Settings (id = 1) : app mono-utilisateur.
 */

const SETTINGS_ID = 1;

export type AppSettings = { firstName: string | null; onboarded: boolean };

export async function getAppSettings(): Promise<AppSettings> {
  const settings = await prisma.settings.findUnique({ where: { id: SETTINGS_ID } });
  return { firstName: settings?.firstName ?? null, onboarded: Boolean(settings?.onboardedAt) };
}

export async function saveFirstName(firstName: string): Promise<void> {
  const value = firstName.trim().slice(0, 40) || null;
  await prisma.settings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, firstName: value },
    update: { firstName: value },
  });
}

export async function completeOnboarding(): Promise<void> {
  await prisma.settings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, onboardedAt: new Date() },
    update: { onboardedAt: new Date() },
  });
}

export async function getPushPublicKey(): Promise<string> {
  return (await getVapidKeys()).publicKey;
}

export type SerializedSubscription = { endpoint: string; keys?: { p256dh?: string; auth?: string } };

export async function subscribePush(sub: SerializedSubscription): Promise<{ ok: boolean }> {
  const p256dh = sub.keys?.p256dh;
  const auth = sub.keys?.auth;
  if (!sub.endpoint?.startsWith("https://") || !p256dh || !auth) return { ok: false };
  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    create: { endpoint: sub.endpoint, p256dh, auth },
    update: { p256dh, auth },
  });
  return { ok: true };
}

export async function unsubscribePush(endpoint: string): Promise<void> {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}

/** Notification d'essai, envoyée juste après l'activation pour vérifier que tout marche. */
export async function sendTestPush(): Promise<{ sent: number }> {
  const { firstName } = await getAppSettings();
  const { sent } = await sendPushToAll({
    title: firstName ? `C'est parti, ${firstName} !` : "C'est parti !",
    body: "Vous recevrez chaque matin le programme de votre journée.",
    url: "/",
  });
  return { sent };
}
