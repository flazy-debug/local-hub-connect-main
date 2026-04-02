// Service Worker de base pour rendre l'application installable (PWA)
// Un gestionnaire d'événement fetch même vide est suffisant pour déclencher l'installation sur Android.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // Laisse passer toutes les requêtes réseau normalement
});
