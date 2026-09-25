// prune.js：裁剪与降级（必选先占预算，其余按代价升序挑，超预算的必选报错）
export function plan(ops, budget, pinned) {
  const required = new Set(pinned || []);
  for (const op of ops) {
    if (op.required) required.add(op.id);
  }

  let spent = 0;
  for (const op of ops) {
    if (required.has(op.id)) spent += op.cost;
  }
  if (spent > budget) {
    const error = new Error("required ops exceed budget");
    error.code = "E_REQUIRED_PRUNED";
    throw error;
  }

  const rest = ops.filter((op) => !required.has(op.id));
  rest.sort((a, b) => (a.cost - b.cost) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const picked = new Set(required);
  for (const op of rest) {
    if (spent + op.cost <= budget) {
      picked.add(op.id);
      spent += op.cost;
    }
  }

  const chosen = [];
  const pruned = [];
  for (const op of ops) {
    (picked.has(op.id) ? chosen : pruned).push(op.id);
  }
  return { chosen: chosen, pruned: pruned, degraded: pruned.length > 0, cost: spent };
}
