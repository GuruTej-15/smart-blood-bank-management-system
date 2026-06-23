/**
 * MinHeap
 * -------
 * Used for: Blood Expiry Tracking (Inventory Module)
 *
 * Keyed by `expiryDate` so the unit closest to expiring is always at the
 * root - lets the system cheaply answer "what expires soonest?" and
 * "what expires within N days?" without scanning the whole inventory.
 */

const BinaryHeap = require("./BinaryHeap");

class MinHeap {
  constructor() {
    this.heap = new BinaryHeap((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
  }

  insert(unit) {
    return this.heap.insert(unit);
  }

  /** Look at the soonest-to-expire unit without removing it */
  peekSoonest() {
    return this.heap.peek();
  }

  /** Remove and return the soonest-to-expire unit */
  extractSoonest() {
    return this.heap.extract();
  }

  /** All units expiring within `days` from now, soonest first */
  expiringWithin(days) {
    const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return this.heap
      .toSortedArray()
      .filter((u) => new Date(u.expiryDate) <= cutoff);
  }

  /** All already-expired units (expiryDate in the past) */
  expired() {
    const now = new Date();
    return this.heap.toSortedArray().filter((u) => new Date(u.expiryDate) < now);
  }

  removeWhere(predicate) {
    return this.heap.removeWhere(predicate);
  }

  get size() {
    return this.heap.size;
  }

  toSortedArray() {
    return this.heap.toSortedArray();
  }

  clear() {
    this.heap.clear();
  }
}

module.exports = MinHeap;
