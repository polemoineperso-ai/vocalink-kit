import webpush from "web-push";
import { prisma } from "@/lib/prisma";

/**
 * Notifications du téléphone (Web Push). Les clés VAPID sont générées au
 * premier besoin et rangées dans la table Settings : rien à configurer à
 * l'installation, ce qui garde le guide d'installation simple.
 *
 * Ne lève jamais : une notification qui échoue ne doit rien casser. Les
 * abonnements expirés (appareil réinitialisé, permission retirée) sont
 * supprimés au passage.
 */

const SETTINGS_ID = 1;
// Contact exigé par le protocole VAPID ; jamais affiché à l'utilisateur.
const VAPID_SUBJECT = "mailto:notifications@vocalink.invalid";

export type PushPayload = { title: string; body: string; url?: string };

export async function getVapidKeys(): Promise<{ publicKey: string; privateKey: string }> {
  const settings = await prisma.settings.findUnique({ where: { id: SETTINGS_ID } });
  if (settings?.vapidPublicKey && settings.vapidPrivateKey) {
    return { publicKey: settings.vapidPublicKey, privateKey: settings.vapidPrivateKey };
  }
  const keys = webpush.generateVAPIDKeys();
  await prisma.settings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, vapidPublicKey: keys.publicKey, vapidPrivateKey: keys.privateKey },
    update: { vapidPublicKey: keys.publicKey, vapidPrivateKey: keys.privateKey },
  });
  return keys;
}

export async function sendPushToAll(payload: PushPayload): Promise<{ sent: number; removed: number }> {
  const subscriptions = await prisma.pushSubscription.findMany();
  if (subscriptions.length === 0) return { sent: 0, removed: 0 };

  const { publicKey, privateKey } = await getVapidKeys();
  let sent = 0;
  let removed = 0;
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
        { vapidDetails: { subject: VAPID_SUBJECT, publicKey, privateKey }, TTL: 12 * 60 * 60 },
      );
      sent++;
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        removed++;
      } else {
        console.error("[push] échec d'envoi", status, e);
      }
    }
  }
  return { sent, removed };
}
