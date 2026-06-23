/**
 * Queue (FIFO)
 * ------------
 * Used for: Normal (non-emergency) Blood Requests
 *
 * Implemented with a doubly-indexed array + head pointer so enqueue/dequeue
 * are both O(1) amortized (avoids the O(n) cost of Array.shift()).
 */

class Queue {
  constructor() {
    this.items = [];
    this.headIndex = 0;
  }

  enqueue(item) {
    this.items.push(item);
    return item;
  }

  dequeue() {
    if (this.isEmpty()) return null;
    const item = this.items[this.headIndex];
    this.headIndex++;
    // Periodically compact the array so memory doesn't grow unbounded
    if (this.headIndex > 1000 && this.headIndex * 2 > this.items.length) {
      this.items = this.items.slice(this.headIndex);
      this.headIndex = 0;
    }
    return item;
  }

  peek() {
    return this.isEmpty() ? null : this.items[this.headIndex];
  }

  isEmpty() {
    return this.headIndex >= this.items.length;
  }

  get size() {
    return this.items.length - this.headIndex;
  }

  toArray() {
    return this.items.slice(this.headIndex);
  }

  remove(predicate) {
    const remaining = this.toArray().filter((item) => !predicate(item));
    const removedCount = this.size - remaining.length;
    this.items = remaining;
    this.headIndex = 0;
    return removedCount > 0;
  }

  clear() {
    this.items = [];
    this.headIndex = 0;
  }
}

module.exports = Queue;
