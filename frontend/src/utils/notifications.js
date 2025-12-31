const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    return registration;
  } catch (error) {
    console.error('SW register failed', error);
    return null;
  }
};

const subscribeUserToPush = async (registration, vapidKey) => {
  if (!registration || !('pushManager' in registration)) return null;
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKey
    });
    return subscription;
  } catch (error) {
    console.error('Push subscribe failed', error);
    return null;
  }
};

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const initPushNotifications = async (vapidPublicKey) => {
  if (!vapidPublicKey || Notification.permission === 'denied') return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const registration = await registerServiceWorker();
  if (!registration) return null;

  const subscription = await subscribeUserToPush(
    registration,
    urlBase64ToUint8Array(vapidPublicKey)
  );

  return subscription;
};
