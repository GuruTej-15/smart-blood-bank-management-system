/**
 * PriorityQueue
 * -------------
 * Used for: Emergency Requests
 *
 * Max-heap ordered by priority level so the most critical request is
 * always at the root and extracted first.
 *
 * Priority Levels (higher number = more urgent, processed first):
 *   Critical = 4, High = 3, Medium = 2, Normal = 1
 */

const BinaryHeap = require("./BinaryHeap");

const PRIORITY_RANK = {
  critical: 4,
  high: 3,
  medium: 2,
  normal: 1,
};

function rankOf(item) {
  return PRIORITY_RANK[String(item.priority).toLowerCase()] ?? 0;
}

class PriorityQueue {
  constructor() {
    // Higher rank first; tie-break by earlier createdAt (FIFO within same priority)
    this.heap = new BinaryHeap((a, b) => {
      const diff = rankOf(b) - rankOf(a);
      if (diff !== 0) return diff;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
  }

  enqueue(item) {
    return this.heap.insert(item);
  }

  /** Pop the single most urgent request */
  dequeue() {
    return this.heap.extract();
  }

  peek() {
    return this.heap.peek();
  }

  get size() {
    return this.heap.size;
  }

  isEmpty() {
    return this.heap.isEmpty();
  }

  /** Full snapshot, most urgent first - for UI display */
  toSortedArray() {
    return this.heap.toSortedArray();
  }

  removeWhere(predicate) {
    return this.heap.removeWhere(predicate);
  }

  clear() {
    this.heap.clear();
  }
}

module.exports = { PriorityQueue, PRIORITY_RANK };
