// prune.js：预算裁剪与降级标记
//
// 规则：
//   1. 必选算子（required 为真或 id 在 pinned 中）先占预算；
//      必选代价之和超过预算时抛 E_REQUIRED_PRUNED，绝不静默裁掉。
//   2. 其余算子按代价升序排序一次（同代价按编号升序），
//      在剩余预算内依次挑入，选不进的进 pruned。
//   3. chosen / pruned 按输入顺序输出；pruned 非空即降级。

// 编号比较：o0、o1、…、o10 按数值大小；非数字编号回退到字符串序。
function compareById(a, b) {
  const na = /\d+$/.exec(a);
  const nb = /\d+$/.exec(b);
  if (na && nb) {
    const diff = Number(na[0]) - Number(nb[0]);
    if (diff !== 0) return diff;
  }
  return a < b ? -1 : a > b ? 1 : 0;
}

export function plan(ops, budget, pinned) {
  const pinnedIds = new Set(pinned || []);
  const required = [];
  const optional = [];
  for (const op of ops) {
    if (op.required === true || pinnedIds.has(op.id)) required.push(op);
    else optional.push(op);
  }

  // 必选算子先占预算；放不下直接报错，由调用方如实呈现降级。
  let cost = required.reduce((total, op) => total + op.cost, 0);
  if (cost > budget) {
    const error = new Error("required operators exceed budget: " + cost + " > " + budget);
    error.code = "E_REQUIRED_PRUNED";
    throw error;
  }

  // 只排序一次：O(n log n)，十万算子也不做两两比较式的反复挑选。
  const sorted = optional.slice().sort((a, b) => {
    if (a.cost !== b.cost) return a.cost - b.cost;
    return compareById(a.id, b.id);
  });

  const chosenIds = new Set(required.map((op) => op.id));
  for (const op of sorted) {
    if (cost + op.cost <= budget) {
      chosenIds.add(op.id);
      cost += op.cost;
    }
  }

  const chosen = [];
  const pruned = [];
  for (const op of ops) {
    if (chosenIds.has(op.id)) chosen.push(op.id);
    else pruned.push(op.id);
  }

  return { chosen, pruned, degraded: pruned.length > 0, cost };
}
