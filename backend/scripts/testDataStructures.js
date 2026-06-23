/**
 * Quick sanity tests for every custom data structure.
 * Run with: npm run test:ds
 * No database or server needed - pure unit-level checks.
 */
const assert = require("assert");
const HashTable = require("../dataStructures/HashTable");
const LinkedList = require("../dataStructures/LinkedList");
const Queue = require("../dataStructures/Queue");
const { PriorityQueue } = require("../dataStructures/PriorityQueue");
const MinHeap = require("../dataStructures/MinHeap");
const MaxHeap = require("../dataStructures/MaxHeap");

function section(name, fn) {
  fn();
  console.log(`✔ ${name}`);
}

section("HashTable: set/get/delete + bucket push", () => {
  const ht = new HashTable();
  ht.set("A+", 25);
  ht.set("O-", 5);
  assert.strictEqual(ht.get("A+"), 25);
  assert.strictEqual(ht.get("O-"), 5);
  assert.strictEqual(ht.get("AB+"), undefined);
  ht.pushToBucketValue("B+", { unitId: 1 });
  ht.pushToBucketValue("B+", { unitId: 2 });
  assert.strictEqual(ht.get("B+").length, 2);
  ht.delete("A+");
  assert.strictEqual(ht.has("A+"), false);
  // force a resize and confirm data integrity survives it
  for (let i = 0; i < 100; i++) ht.set(`key${i}`, i);
  assert.strictEqual(ht.get("key50"), 50);
});

section("LinkedList: insert/find/update/remove/filter", () => {
  const list = new LinkedList();
  list.insertAtEnd({ id: 1, bloodGroup: "O-" });
  list.insertAtEnd({ id: 2, bloodGroup: "A+" });
  list.insertAtStart({ id: 0, bloodGroup: "B+" });
  assert.strictEqual(list.length, 3);
  assert.strictEqual(list.head.data.id, 0);
  const found = list.find((d) => d.id === 2);
  assert.strictEqual(found.data.bloodGroup, "A+");
  list.update((d) => d.id === 2, { bloodGroup: "AB+" });
  assert.strictEqual(list.find((d) => d.id === 2).data.bloodGroup, "AB+");
  const oNeg = list.filter((d) => d.bloodGroup === "O-");
  assert.strictEqual(oNeg.length, 1);
  assert.strictEqual(list.remove((d) => d.id === 0), true);
  assert.strictEqual(list.length, 2);
  assert.strictEqual(list.head.data.id, 1);
});

section("Queue: FIFO order maintained", () => {
  const q = new Queue();
  q.enqueue("req-1");
  q.enqueue("req-2");
  q.enqueue("req-3");
  assert.strictEqual(q.size, 3);
  assert.strictEqual(q.dequeue(), "req-1");
  assert.strictEqual(q.dequeue(), "req-2");
  assert.strictEqual(q.peek(), "req-3");
  assert.strictEqual(q.size, 1);
});

section("PriorityQueue: critical extracted before normal", () => {
  const pq = new PriorityQueue();
  pq.enqueue({ id: "r1", priority: "normal", createdAt: new Date(2026, 0, 1) });
  pq.enqueue({ id: "r2", priority: "critical", createdAt: new Date(2026, 0, 2) });
  pq.enqueue({ id: "r3", priority: "high", createdAt: new Date(2026, 0, 3) });
  pq.enqueue({ id: "r4", priority: "critical", createdAt: new Date(2026, 0, 1) }); // earlier critical
  const order = [];
  while (!pq.isEmpty()) order.push(pq.dequeue().id);
  // r4 before r2 (both critical, r4 created earlier -> FIFO tie-break), then high, then normal
  assert.deepStrictEqual(order, ["r4", "r2", "r3", "r1"]);
});

section("MinHeap: soonest expiry extracted first", () => {
  const mh = new MinHeap();
  mh.insert({ id: "u1", expiryDate: new Date(2026, 5, 30) });
  mh.insert({ id: "u2", expiryDate: new Date(2026, 5, 20) });
  mh.insert({ id: "u3", expiryDate: new Date(2026, 6, 15) });
  assert.strictEqual(mh.peekSoonest().id, "u2");
  assert.strictEqual(mh.extractSoonest().id, "u2");
  assert.strictEqual(mh.extractSoonest().id, "u1");
});

section("MaxHeap: top donor extracted first + topN", () => {
  const mh = new MaxHeap();
  mh.insert({ id: "d1", totalDonations: 3 });
  mh.insert({ id: "d2", totalDonations: 12 });
  mh.insert({ id: "d3", totalDonations: 7 });
  assert.strictEqual(mh.peekTop().id, "d2");
  const top2 = mh.topN(2).map((d) => d.id);
  assert.deepStrictEqual(top2, ["d2", "d3"]);
});

console.log("\nAll data structure tests passed.\n");
