// Service worker de Vocalink : affiche les notifications (brief du matin…)
// et ouvre la bonne page quand on touche la notification.

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Vocalink", body: event.data.text() };
  }
  // Pastille rouge sur l'icône (iPhone : app ajoutée à l'écran d'accueil).
  let badge = Promise.resolve();
  if (typeof data.badgeCount === "number" && "setAppBadge" in self.navigator) {
    badge = (data.badgeCount > 0 ? self.navigator.setAppBadge(data.badgeCount) : self.navigator.clearAppBadge()).catch(() => {});
  }
  event.waitUntil(
    Promise.all([
      badge,
      self.registration.showNotification(data.title || "Vocalink", {
        body: data.body || "",
        icon: "/icon",
        badge: "/icon",
        data: { url: data.url || "/" },
      }),
    ]),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
