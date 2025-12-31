export const formatMessage = (messageDoc) => {
  if (!messageDoc) return null;
  const message = messageDoc.toObject ? messageDoc.toObject({ virtuals: true }) : { ...messageDoc };

  if (message.room?._id) {
    message.room = message.room._id.toString();
  } else if (message.room) {
    message.room = message.room.toString();
  }

  if (message.sender?._id) {
    message.sender._id = message.sender._id.toString();
  }

  return message;
};

export const formatMessages = (messages) => messages.map((msg) => formatMessage(msg));
