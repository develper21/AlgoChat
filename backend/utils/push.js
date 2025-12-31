import '../config/env.js';
import webpush from 'web-push';
const hasVapidKeys = Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

if (hasVapidKeys) {
  webpush.setVapidDetails(
    'mailto:notifications@algonive.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn('VAPID keys are missing. Web push notifications are disabled.');
}

export const sendPushNotifications = async (users, payload) => {
  if (!hasVapidKeys) return;

  const jsonPayload = JSON.stringify(payload);
  const sendPromises = [];

  users.forEach((user) => {
    user.pushSubscriptions.forEach((subscription) => {
      sendPromises.push(
        webpush
          .sendNotification(subscription, jsonPayload)
          .catch((error) => console.error('Push notification error', error.message))
      );
    });
  });

  await Promise.all(sendPromises);
};

export const isPushConfigured = () => hasVapidKeys;
