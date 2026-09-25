// pipeline.js：算子与代价（基线：全跑、不看预算）
export function pick(ops, budget) {
  return { chosen: ops.map((op) => op.id), cost: ops.reduce((total, op) => total + op.cost, 0), degraded: false };
}
