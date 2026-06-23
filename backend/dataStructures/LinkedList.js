/**
 * LinkedList (singly linked)
 * --------------------------
 * Used for: Donor Records (Donor Module)
 *
 * Donor records grow continuously as new people register, and the system
 * frequently needs to insert/remove individual donors and walk the full
 * list (e.g. for the Smart Donor Finder). A linked list models that
 * dynamic, sequential-access workload directly, as required by the spec.
 *
 * Each node stores the donor data (a plain object mirroring the Mongo
 * document, including its _id as `id` for cross-referencing).
 */

class Node {
  constructor(data) {
    this.data = data;
    this.next = null;
  }
}

class LinkedList {
  constructor() {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  insertAtEnd(data) {
    const node = new Node(data);
    if (!this.head) {
      this.head = node;
      this.tail = node;
    } else {
      this.tail.next = node;
      this.tail = node;
    }
    this.length++;
    return node;
  }

  insertAtStart(data) {
    const node = new Node(data);
    node.next = this.head;
    this.head = node;
    if (!this.tail) this.tail = node;
    this.length++;
    return node;
  }

  /** Find first node where predicate(data) is true */
  find(predicate) {
    let current = this.head;
    while (current) {
      if (predicate(current.data)) return current;
      current = current.next;
    }
    return null;
  }

  /** Update the data object for the node matching predicate (merges fields) */
  update(predicate, newData) {
    const node = this.find(predicate);
    if (!node) return null;
    node.data = { ...node.data, ...newData };
    return node.data;
  }

  /** Remove first node matching predicate. Returns true if removed. */
  remove(predicate) {
    let current = this.head;
    let prev = null;
    while (current) {
      if (predicate(current.data)) {
        if (prev) {
          prev.next = current.next;
        } else {
          this.head = current.next;
        }
        if (current === this.tail) this.tail = prev;
        this.length--;
        return true;
      }
      prev = current;
      current = current.next;
    }
    return false;
  }

  /** Return all data objects matching predicate (or all, if no predicate) */
  filter(predicate = () => true) {
    const out = [];
    let current = this.head;
    while (current) {
      if (predicate(current.data)) out.push(current.data);
      current = current.next;
    }
    return out;
  }

  toArray() {
    return this.filter();
  }

  clear() {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }
}

module.exports = LinkedList;
