/**
 * BinaryHeap (generic)
 * --------------------
 * Array-backed binary heap. The `compare(a, b)` function decides ordering:
 *   - return < 0 if `a` should come before `b` (closer to the root)
 *   - return > 0 if `b` should come before `a`
 *
 * Used as the engine behind PriorityQueue (emergency requests, max-heap by
 * priority), MinHeap (expiry tracking, min-heap by expiry date) and
 * MaxHeap (donor leaderboard, max-heap by total donations).
 *
 * insert: O(log n)   extract: O(log n)   peek: O(1)
 */

class BinaryHeap {
  constructor(compare) {
    this.compare = compare;
    this.items = [];
  }

  get size() {
    return this.items.length;
  }

  isEmpty() {
    return this.items.length === 0;
  }

  peek() {
    return this.isEmpty() ? null : this.items[0];
  }

  insert(item) {
    this.items.push(item);
    this._bubbleUp(this.items.length - 1);
    return item;
  }

  extract() {
    if (this.isEmpty()) return null;
    const top = this.items[0];
    const last = this.items.pop();
    if (this.items.length > 0) {
      this.items[0] = last;
      this._bubbleDown(0);
    }
    return top;
  }

  /** Returns the top `n` items without removing them, in heap order */
  peekN(n) {
    return [...this.items].sort(this.compare).slice(0, n);
  }

  /** Removes and returns all items matching predicate; rebuilds the heap */
  removeWhere(predicate) {
    const removed = this.items.filter(predicate);
    this.items = this.items.filter((i) => !predicate(i));
    this._heapify();
    return removed;
  }

  toSortedArray() {
    return [...this.items].sort(this.compare);
  }

  clear() {
    this.items = [];
  }

  _heapify() {
    for (let i = Math.floor(this.items.length / 2) - 1; i >= 0; i--) {
      this._bubbleDown(i);
    }
  }

  _bubbleUp(index) {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.compare(this.items[index], this.items[parent]) < 0) {
        this._swap(index, parent);
        index = parent;
      } else break;
    }
  }

  _bubbleDown(index) {
    const n = this.items.length;
    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let smallest = index;
      if (left < n && this.compare(this.items[left], this.items[smallest]) < 0) smallest = left;
      if (right < n && this.compare(this.items[right], this.items[smallest]) < 0) smallest = right;
      if (smallest === index) break;
      this._swap(index, smallest);
      index = smallest;
    }
  }

  _swap(i, j) {
    [this.items[i], this.items[j]] = [this.items[j], this.items[i]];
  }
}

module.exports = BinaryHeap;
