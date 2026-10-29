self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; }
  catch { data = { title: "ديليفري الأتارب", body: event.data ? event.data.text() : "عندك تحديث جديد" }; }
  const title = data.title || "ديليفري الأتارب";
  const options = {
    body: data.body || "عندك تحديث جديد",
    icon: "./icon-192.png",
    badge: "./icon-192.png",
    data: { url: data.url || "./", orderNumber: data.orderNumber || null },
    tag: data.tag || "delivery-update",
    renotify: true
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "./", self.location.origin).href;
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of clients) {
      if (client.url.startsWith(self.location.origin) && "focus" in client) {
        await client.focus();
        if ("navigate" in client) await client.navigate(target);
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(target);
  })());
});
