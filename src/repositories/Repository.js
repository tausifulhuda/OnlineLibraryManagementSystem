const fs = require('node:fs');
const path = require('node:path');

/**
 * Repository pattern: services never touch storage directly.
 * Works in memory by default; pass a file path to persist as JSON.
 * Swap this class for a SQL-backed one without changing any service.
 */
class Repository {
  constructor(filePath = null, Model = null) {
    this.filePath = filePath;
    this.Model = Model;
    this.items = new Map();
    this.nextId = 1;
    if (filePath && fs.existsSync(filePath)) {
      const saved = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      this.nextId = saved.nextId;
      for (const raw of saved.items) {
        this.items.set(raw.id, Model ? new Model(raw) : raw);
      }
    }
  }

  add(entity) {
    entity.id = this.nextId++;
    this.items.set(entity.id, entity);
    this.#save();
    return entity;
  }

  get(id) { return this.items.get(Number(id)) || null; }
  all() { return [...this.items.values()]; }
  find(predicate) { return this.all().filter(predicate); }

  update(entity) {
    if (!this.items.has(entity.id)) return null;
    this.items.set(entity.id, entity);
    this.#save();
    return entity;
  }

  remove(id) {
    const removed = this.items.delete(Number(id));
    if (removed) this.#save();
    return removed;
  }

  #save() {
    if (!this.filePath) return;
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify({ nextId: this.nextId, items: this.all() }, null, 2));
  }
}

module.exports = Repository;