// Polyfill for Node.js 'events' module required by 'xlsx' in React Native
function EventEmitter() {
  this._events = {};
}

EventEmitter.prototype.on = function (event, listener) {
  if (!this._events[event]) this._events[event] = [];
  this._events[event].push(listener);
  return this;
};

EventEmitter.prototype.addListener = EventEmitter.prototype.on;

EventEmitter.prototype.once = function (event, listener) {
  const wrapper = (...args) => {
    listener.apply(this, args);
    this.off(event, wrapper);
  };
  return this.on(event, wrapper);
};

EventEmitter.prototype.off = function (event, listener) {
  if (!this._events[event]) return this;
  this._events[event] = this._events[event].filter((l) => l !== listener);
  return this;
};

EventEmitter.prototype.removeListener = EventEmitter.prototype.off;

EventEmitter.prototype.removeAllListeners = function (event) {
  if (event) {
    delete this._events[event];
  } else {
    this._events = {};
  }
  return this;
};

EventEmitter.prototype.emit = function (event, ...args) {
  if (!this._events[event]) return false;
  this._events[event].forEach((listener) => listener.apply(this, args));
  return true;
};

EventEmitter.prototype.listeners = function (event) {
  return this._events[event] ? this._events[event].slice() : [];
};

EventEmitter.prototype.listenerCount = function (event) {
  return this._events[event] ? this._events[event].length : 0;
};

EventEmitter.prototype.eventNames = function () {
  return Object.keys(this._events);
};

EventEmitter.defaultMaxListeners = 10;

module.exports = { EventEmitter, default: EventEmitter };
