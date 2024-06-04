let id = 0;
function ev() { this.init(...arguments) };
ev.prototype.constructor = ev;
ev.prototype.init = function () {
  this.events = new Map();
}
ev.prototype.on = function (name, cb, once) {
  let list = this.events.get(name);
  if (!list) {
    this.events.set(name, new Map());
    return this.on(...arguments);
  }
  ++id;
  list.set(id, { cb, once });
  return id;
}
ev.prototype.off = function (name, id) {
  if (!id) {
    this.events.delete(name);
    return;
  }
  let list = this.events.get(name);
  list.delete(id);
}
ev.prototype.emit = function (name, args, id) {
  let list = this.events.get(name);
  if (!list) return;
  if (!id) {
    list.forEach((value, id, list) => {
      this._emit(value, id, list, args);
    })
    return;
  }
  let value = list.get(id);
  this._emit(value, id, list, args);
}
ev.prototype._emit = function (value, id, list, args) {
  if (!value) return;
  value.cb(...args);
  if (value.once) {
    list.delete(id);
  }
}

export { ev };