export const subscribe = async (req, res) => {
  try {
    const subscription = req.body;
    if (!subscription?.endpoint) {
      return res.status(400).json({ message: 'Invalid subscription' });
    }

    const exists = req.user.pushSubscriptions.some((sub) => sub.endpoint === subscription.endpoint);
    if (!exists) {
      req.user.pushSubscriptions.push(subscription);
      await req.user.save();
    }

    res.json({ message: 'Subscribed to push notifications' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
