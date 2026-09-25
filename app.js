// app.js：渲染结果
import { pick } from "./pipeline.js";
import { plan } from "./prune.js";

export function render(spec) {
  const base = pick(spec.ops, spec.budget);
  const planned = plan(spec.ops, spec.budget, spec.pinned || []);
  return { chosen: planned.chosen, pruned: planned.pruned, degraded: planned.degraded,
           cost: planned.cost, covered: planned.pruned.length === 0,
           full_cost: base.cost };
}
