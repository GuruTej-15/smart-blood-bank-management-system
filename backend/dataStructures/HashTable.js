/**
 * HashTable
 * ---------
 * Used for: Blood Group Lookup (Inventory Module)
 * Custom implementation (separate chaining) rather than relying on a plain
 * JS object, so collision handling and resizing are explicit and inspectable.
 *
 * Key   -> blood group string, e.g. "A+", "O-"
 * Value -> array of inventory "batch" records for that group
 *
 * Average time complexity: O(1) for get/set/delete (amortized).
 */

class HashTable {
  constructor(initialCapacity = 16) {
    this.capacity = initialCapacity;
    this.size = 0;
    this.buckets = new Array(this.capacity).fill(null).map(() => []);
  }

  _hash(key) {
    const str = String(key);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) >>> 0; // unsigned 32-bit
    }
    return hash % this.capacity;
  }

  _resizeIfNeeded() {
    const loadFactor = this.size / this.capacity;
    if (loadFactor > 0.75) {
      const oldBuckets = this.buckets;
      this.capacity *= 2;
      this.buckets = new Array(this.capacity).fill(null).map(() => []);
      this.size = 0;
      for (const bucket of oldBuckets) {
        for (const [k, v] of bucket) {
          this.set(k, v);
        }
      }
    }
  }

  /** Set/replace the entire value for a key */
  set(key, value) {
    const index = this._hash(key);
    const bucket = this.buckets[index];
    const existing = bucket.find((entry) => entry[0] === key);
    if (existing) {
      existing[1] = value;
    } else {
      bucket.push([key, value]);
      this.size++;
      this._resizeIfNeeded();
    }
    return value;
  }

  /** Get the value for a key (or undefined) */
  get(key) {
    const index = this._hash(key);
    const bucket = this.buckets[index];
    const entry = bucket.find((entry) => entry[0] === key);
    return entry ? entry[1] : undefined;
  }

  has(key) {
    return this.get(key) !== undefined;
  }

  delete(key) {
    const index = this._hash(key);
    const bucket = this.buckets[index];
    const idx = bucket.findIndex((entry) => entry[0] === key);
    if (idx !== -1) {
      bucket.splice(idx, 1);
      this.size--;
      return true;
    }
    return false;
  }

  /** Push a single batch/unit into the array stored at `key`, creating it if needed */
  pushToBucketValue(key, item) {
    const current = this.get(key);
    if (current === undefined) {
      this.set(key, [item]);
    } else {
      current.push(item);
    }
  }

  keys() {
    const out = [];
    for (const bucket of this.buckets) {
      for (const [k] of bucket) out.push(k);
    }
    return out;
  }

  entries() {
    const out = [];
    for (const bucket of this.buckets) {
      for (const entry of bucket) out.push(entry);
    }
    return out;
  }

  clear() {
    this.capacity = 16;
    this.size = 0;
    this.buckets = new Array(this.capacity).fill(null).map(() => []);
  }
}

module.exports = HashTable;
