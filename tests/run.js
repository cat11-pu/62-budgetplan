import assert from "node:assert";
import { pick } from "../pipeline.js";
import { plan } from "../prune.js";
import { render } from "../app.js";

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

const ops = [{ id: "o0", cost: 3, required: true }, { id: "o1", cost: 5, required: false }];

check("pick returns chosen list", () => {
  assert.ok(Array.isArray(pick(ops, 4).chosen));
});

check("pick reports cost", () => {
  assert.strictEqual(typeof pick(ops, 4).cost, "number");
});

check("plan returns pruned list", () => {
  assert.ok(Array.isArray(plan(ops, 4, []).pruned));
});

check("plan reports degraded flag", () => {
  assert.strictEqual(typeof plan(ops, 4, []).degraded, "boolean");
});

check("render exposes covered flag", () => {
  assert.strictEqual(typeof render({ ops: ops, budget: 4, pinned: [] }).covered, "boolean");
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
