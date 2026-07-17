# Skill 体系设计

> **版本**：V0.1
> **状态**：设计基线
> **日期**：2026-07-17

## 1. Skill 定位

Skill 是 AI 员工完成一类业务任务的方法契约，负责 Prompt、输入输出 Schema、允许 Tool、证据要求和评估规则。Skill 不负责身份、Scope、审批、幂等、调度、状态机或数据库访问。

首期 Skill 只由平台预置并版本化维护。租户不能创建、复制或修改 Skill，也不能编辑 Prompt、Schema、Tool 白名单、执行代码、Guard 或评估规则。

## 2. Skill Definition

```yaml
skill_code: risk_store_analysis
version: 1.0.0
allowed_roles:
  - risk_supervisor
input_schema: schemas/risk_store_analysis.input.json
output_schema: schemas/risk_store_analysis.output.json
allowed_tools:
  - query_knowledge_base
  - query_risk_stores
  - query_common_issues
  - query_rectification_progress
risk_level: L1
evidence_policy: required
```

Definition 至少包含：

- 稳定编码和语义版本；
- 允许的 Role；
- 输入输出 JSON Schema；
- Tool 白名单；
- Prompt/Instruction 版本；
- 最大 Tool 轮数和结果大小；
- 证据要求、失败策略和评估规则。

## 3. 输入契约

输入分为三类：

| 类型 | 来源 | 示例 |
|---|---|---|
| 业务输入 | Workflow | 风险记录、统计日期、门店、规则 |
| 可信上下文 | Agent Service | 租户、员工、Scope、Run、允许 Tool |
| 证据引用 | Tool/Artifact | 风险明细、人员、巡店和整改记录 |

Prompt 只能读取可信上下文，不能要求模型补全缺失的租户、人员、权限或业务状态。

## 4. 输出契约

`risk_store_analysis` 的结构化输出至少包含：

```json
{
  "summary": "...",
  "risk_level": "LOW|MEDIUM|HIGH",
  "findings": [],
  "evidence_refs": [],
  "missing_facts": [],
  "recommended_action": "ANALYZE_ONLY|CREATE_QUESTION_DRAFT",
  "confidence": 0.0,
  "limitations": []
}
```

约束：

- 事实结论必须引用 Tool 证据；
- 缺少关键事实时写入 `missing_facts`，不得猜测；
- 输出中的动作只是建议，不能绕过 Workflow 和审批；
- Schema 不通过时 Step 失败或进入受控重试，不推动后续业务动作。

## 5. Tool 权限

Skill 声明的是最大 Tool 集合。Run 实际可用 Tool 为以下交集：

```text
Role allowed tools
∩ Skill allowed tools
∩ Workflow Step allowed tools
∩ Employee current scope
∩ Current risk policy
```

模型不能调用未暴露 Tool。Tool Gateway 对每次调用重新执行后端校验，被拒绝调用仍写审计。

## 6. 版本与快照

平台发布 Skill 新版本时保留历史版本。Workflow Instance 固化 Skill 版本或完整快照，运行中实例和 Run 不读取最新版本。

以下变化必须产生新版本：

- Prompt 或 System Instruction；
- 输入输出 Schema；
- Tool 白名单；
- 证据和 Guard 规则；
- 模型能力要求；
- 评估门槛。

租户时间、阈值、审批和业务策略参数存放在 Workflow Settings，不通过复制租户私有 Skill 表达。

## 7. 当前与目标能力

当前 Demo 只实现 `risk_store_analysis`，覆盖风险门店、共性问题、整改进度和跟进草稿。

责任定位、整改建议和 Case 跟进可以先作为同一 Workflow 中的受控步骤。只有满足以下条件后才拆分独立 Skill：

- 输入输出稳定；
- 能跨多个 Workflow 复用；
- 可以独立评估；
- 权限或失败风险明显不同。

AI 店长助手、运营经理、食安等后续岗位不属于首期实现，不在当前 Skill Catalog 发布。

## 8. Runtime 绑定

AI Skill Step 执行时：

1. Workflow 选择员工和 Skill 版本；
2. Context Builder 注入可信上下文；
3. Runtime 只暴露交集后的 Tool Schema；
4. 模型执行 Tool Loop；
5. Runtime 校验输出 Schema 和证据；
6. Run 保存模型、Prompt、Skill、Tool 和用量；
7. Workflow 根据结构化结果执行确定性路由。

## 9. 评估

Skill 评估至少包含：

- 事实正确性和证据覆盖；
- 输出 Schema 通过率；
- 工具选择正确性和调用成功率；
- 事实编造、越权和敏感信息风险；
- 结果可用率和人工改判率；
- Token、耗时和单次执行成本。

评估反馈只能生成候选 Skill 版本，不能直接修改运行中的 Definition。
