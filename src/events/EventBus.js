/** Observer pattern: services publish events, other services subscribe. */
class EventBus {
  constructor() { this.handlers = {}; }

  on(event, handler) {
    (this.handlers[event] ||= []).push(handler);
  }

  emit(event, payload) {
    (this.handlers[event] || []).forEach(handler => handler(payload));
  }
}

module.exports = EventBus;