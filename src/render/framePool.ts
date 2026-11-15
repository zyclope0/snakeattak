import * as TEXT from '../texts/fr/board.ts';
type PoolOptions<V> = {
  maxIdle: number;
  create: () => V;
  activate: (value: V) => void;
  deactivate: (value: V) => void;
  destroy: (value: V) => void;
};

/** Reusable presentation objects only. Live actors are never capped or recycled here. */
export class FramePool<K, V> {
  private active = new Map<K, V>();
  private idle: V[] = [];
  private used = new Set<K>();
  private created = 0;
  private reused = 0;
  private destroyed = 0;
  private options: PoolOptions<V>;
  constructor(options: PoolOptions<V>) {
    if (!Number.isInteger(options.maxIdle) || options.maxIdle < 0)
      throw new RangeError(TEXT.invalidInactivePoolCapacity);
    this.options = options;
  }
  beginFrame() {
    this.used.clear();
  }
  /** Read-only inspection does not keep a disappeared actor alive. */
  get(key: K) {
    return this.active.get(key);
  }
  acquire(key: K): V {
    this.used.add(key);
    if (this.active.has(key)) return this.active.get(key)!;
    let value: V;
    if (this.idle.length) {
      value = this.idle.pop()!;
      this.reused++;
    } else {
      value = this.options.create();
      this.created++;
    }
    this.options.activate(value);
    this.active.set(key, value);
    return value;
  }
  endFrame() {
    for (const [key, value] of this.active) {
      if (this.used.has(key)) continue;
      this.active.delete(key);
      this.options.deactivate(value);
      if (this.idle.length < this.options.maxIdle) this.idle.push(value);
      else {
        this.options.destroy(value);
        this.destroyed++;
      }
    }
  }
  clear() {
    for (const value of this.active.values()) {
      this.options.destroy(value);
      this.destroyed++;
    }
    for (const value of this.idle) {
      this.options.destroy(value);
      this.destroyed++;
    }
    this.active.clear();
    this.idle.length = 0;
    this.used.clear();
  }
  get stats() {
    return {
      active: this.active.size,
      idle: this.idle.length,
      created: this.created,
      reused: this.reused,
      destroyed: this.destroyed,
    };
  }
}
