/**
 * Lightweight holder for the Socket.IO server instance so non-socket modules
 * (e.g. notification delivery) can push events to a user's room without a hard
 * dependency on the socket layer. All emits are best-effort.
 */
let io = null;

const setIO = (instance) => {
  io = instance;
};

const emitToUser = (userId, event, payload) => {
  if (!io || !userId) return;
  try {
    io.to(`user:${userId}`).emit(event, payload);
  } catch (e) {
    /* ignore – realtime is best-effort */
  }
};

module.exports = { setIO, emitToUser };
