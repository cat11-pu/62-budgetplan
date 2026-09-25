// prune.js：裁剪与降级（基线：不检查必选项）
export function plan(ops, budget, pinned) {
  const chosen = ops.map((op) => op.id);
  return { chosen: chosen, pruned: [], degraded: false, cost: 0 };
}
