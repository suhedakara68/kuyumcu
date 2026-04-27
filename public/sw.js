self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Noventra Altın Alarmı';
  const options = {
    body: data.body || 'Fiyat değişikliği tespit edildi.',
    icon: '/favikon.png',
    badge: '/favikon.png',
    vibrate: [200, 100, 200],
    data: data.url || '/'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data)
  );
});

// Basic fetch handler for PWA requirements
self.addEventListener('fetch', function(event) {
  // Pass through
});
