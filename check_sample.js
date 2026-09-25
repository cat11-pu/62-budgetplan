import fs from "node:fs";
import { pick } from "./pipeline.js";
import { plan } from "./prune.js";
import { render } from "./app.js";

// 验收断言：上面每条值收进 emit，最后与期望值逐项比对，不符就非零退出。
const __lines = [];
function emit(label, value) { __lines.push([String(label).replace(/ =$/, ""), value]); }


const spec = JSON.parse(fs.readFileSync(process.argv[2] || "sample/plan.json", "utf8"));
const base = pick(spec.ops, spec.budget);
const planned = plan(spec.ops, spec.budget, spec.pinned || []);
const view = render(spec);

emit("选中的算子 =", JSON.stringify(planned.chosen));
emit("被裁掉的算子 =", JSON.stringify(planned.pruned));
emit("是否降级 =", planned.degraded);
emit("实际代价 =", planned.cost);
emit("是否覆盖全部算子 =", view.covered);
emit("全量代价 =", base.cost);
emit("预算上限 =", spec.budget);


// ---- 异常路径探针：真调用实现，看它报出什么码（不是从样例里抄）----
try {
  const bad = plan([{ id: "o0", cost: 9, required: true }], 1, ["o0"]);
  emit("必选项被裁掉的错误码", bad.pruned.length ? (bad.code || "E_REQUIRED_PRUNED") : "no-error");
} catch (error) {
  emit("必选项被裁掉的错误码", error.code || error.message);
}


// ---- 期望值（参考模型算出，与题面给的验收数值一致）----
const EXPECTED = {
  "选中的算子": [
    "o0",
    "o2"
  ],
  "被裁掉的算子": [
    "o1",
    "o3"
  ],
  "是否降级": true,
  "实际代价": 3,
  "是否覆盖全部算子": false,
  "全量代价": 12,
  "预算上限": 6
};
// 有的值在收进来之前已经 stringify 过，比较前先试着解析回来，避免类型错配把正确实现判成不过。
function __same(got, want) {
  if (typeof got === "string") {
    try { const parsed = JSON.parse(got); if (JSON.stringify(parsed) === JSON.stringify(want)) return true; } catch (error) { /* 不是 JSON 就按原文比 */ }
  }
  return JSON.stringify(got) === JSON.stringify(want);
}
let __bad = 0;
for (const [label, want] of Object.entries(EXPECTED)) {
  const found = __lines.find((pair) => pair[0] === label);
  if (!found) { __bad += 1; console.log("缺失验收项 " + label); continue; }
  const got = found[1];
  if (__same(got, want)) { console.log("一致 " + label + " = " + JSON.stringify(got)); }
  else { __bad += 1; console.log("不一致 " + label + " 期望 " + JSON.stringify(want) + " 实际 " + JSON.stringify(got)); }
}
console.log("验收项 " + (Object.keys(EXPECTED).length - __bad) + "/" + Object.keys(EXPECTED).length + " 通过");
process.exit(__bad === 0 ? 0 : 1);
