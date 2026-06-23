/**
 * MaxHeap
 * -------
 * Used for: Top Donor Ranking System (Donor Reward leaderboard)
 *
 * Keyed by `totalDonations` so the top donor is always at the root -
 * makes generating a "Top N donors" leaderboard a cheap repeated-extract
 * operation instead of a full sort on every request.
 */

const BinaryHeap = require("./BinaryHeap");

class MaxHeap {
  constructor() {
    this.heap = new BinaryHeap((a, b) => (b.totalDonations ?? 0) - (a.totalDonations ?? 0));
  }

  insert(donor) {
    return this.heap.insert(donor);
  }

  peekTop() {
    return this.heap.peek();
  }

  extractTop() {
    return this.heap.extract();
  }

  /** Top N donors, highest first - does not mutate the heap */
  topN(n) {
    return this.heap.toSortedArray().slice(0, n);
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

module.exports = MaxHeap;
