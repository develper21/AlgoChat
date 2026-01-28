import { formatMessage } from './messageFormatter.js';

// This will be set by index.js to provide access to the io instance
let emitRoomUpdate;

export const setEmitRoomUpdate = (emitFunction) => {
  emitRoomUpdate = emitFunction;
};

export { emitRoomUpdate };
export { formatMessage };
