# Tool 与 Gateway 设计

> **版本**：V0.1
> **状态**：设计基线
> **日期**：2026-07-17

## 1. 设计原则

Tool 是模型可调用的确定性业务能力，Tool Gateway 是身份、权限、范围、审批、幂等和审计的强制边界。

- 模型不能直接访问数据库或生成 SQL；
- Tool 不能信任模型提供的租户、用户、员工或 Scope；
- Hologres 只提供分析事实，业务写入必须进入 Java 业务系统；
- 查询、草稿和动作 Tool 使用不同风险策略；
- 被拒绝的调用与成功调用一样需要持久化；
- MCP 是未来接入协议，不是首期内部架构要求。

## 2. Tool 分类

### 2.1 按风险

| 类型 | 语义 | 首期策略 |
|---|---|---|
| `QUERY` | 查询数据和业务事实 | Scope 与结果限制后执行 |
| `DRAFT` | 生成草稿或计划 | 不写业务系统 |
| `ACTION` | 创建或修改正式业务对象 | 必须审批、幂等和二次权限校验 |

### 2.2 按 Provider

| Provider | 数据源 | 首期 |
|---|---|---|
| `BUILTIN` | Hologres、知识表、本地确定性能力 | 实现 |
| `INTERNAL_API` | Java `/internal/agent/**` | 实现目标 |
| `DRAFT` | Agent Service 内部草稿生成 | 实现 |
| `MCP` | 外部标准协议服务 | 仅预留接口 |

## 3. Tool Contract

```yaml
tool_code: query_risk_stores
version: 1.0.0
type: QUERY
provider: BUILTIN
input_schema: schemas/query_risk_stores.input.json
output_schema: schemas/query_risk_stores.output.json
allowed_skills:
  - risk_store_analysis
risk_level: L0
limits:
  max_days: 31
  max_rows: 100
  timeout_ms: 5000
```

Contract 必须定义：

- 稳定 `tool_code` 和语义版本；
- 查询、草稿或动作类型；
- Provider 和 Handler；
- 输入输出 JSON Schema；
- 允许的 Role/Skill；
- 日期、行数、对象数和超时限制；
- 风险等级、审批策略和幂等策略；
- 敏感字段处理和审计策略。

Tool Code 使用小写蛇形命名，表达业务能力而不是 Controller 或物理表，例如 `get_question_order_status`，不使用 `select_question_table`。

## 4. 输入设计

### 4.1 模型可填写字段

模型只填写业务筛选或动作草稿，例如：

- 日期范围；
- 风险等级；
- 已授权的门店或区域引用；
- 查询数量；
- 整改建议草稿。

### 4.2 后端保留字段

以下字段由 `ToolExecutionContext` 注入，模型输入中出现时拒绝或忽略：

```text
enterprise_id
user_id
employee_id
run_id
tool_call_id
workflow_instance_id
case_id
skill_code
primary_store_id
profile_snapshot_id
ranking_population_scope
allowed_store_ids
allowed_region_ids
approval_id
idempotency_key
```

### 4.3 限制

- 日期范围必须有上限；
- `limit/top_n` 必须有默认值和上限；
- 门店、区域和业务对象数量必须受限；
- 文本字段限制长度和敏感信息；
- 不接受 SQL、URL、类名、表名或任意 HTTP 参数；
- 动作字段由后端根据已批准草稿确定性构造。

## 5. 输出设计

统一输出包：

```json
{
  "success": true,
  "data": {},
  "meta": {
    "source": "hologres|java_business_system",
    "dataset_code": "RISK_STORE_DAILY",
    "data_as_of": "2026-07-16",
    "refresh_status": "SUCCESS",
    "refresh_batch_id": "batch_20260716_01",
    "refresh_completed_at": "2026-07-17 05:20:00",
    "truncated": false,
    "evidence_refs": []
  },
  "error": null
}
```

查询结果必须：

- 显式带来源和数据截止时间；
- 对截断、缺失、过期和质量异常进行标记；
- 返回业务字段和稳定引用，不暴露物理表、Secret 或内部堆栈；
- 控制总行数和文本大小；
- 为模型结论提供可引用证据。

Hologres 分析类 Tool 的 `dataset_code` 和 `refresh_*` 元数据由后端 `DataReadinessProvider` 注入，模型不能填写。`refresh_status` 非 `SUCCESS` 时，Tool 不得把零行结果解释为“没有风险”；Java 实时业务查询仍使用其自身的权威状态和发生时间，不强制伪造刷新字段。

## 6. Tool Gateway 流程

```text
Tool Call
  -> 创建 agent_tool_call = RUNNING
  -> 校验 Run / Employee / Skill / Workflow
  -> 合并并验证 Tool 白名单
  -> 注入租户和 Scope
  -> 校验 Schema、日期、行数和对象归属
  -> 查询数据新鲜度
  -> ACTION 校验审批、摘要和幂等
  -> Provider 执行
  -> 校验并裁剪输出
  -> 保存状态、证据、业务引用和耗时
  -> 返回 Runtime
```

权限集合：

```text
Current Skill ∈ Employee enabled skills
AND Tool ∈ (
  Role allowed tools
  ∩ Current Skill allowed tools
  ∩ Workflow Step allowed tools
  ∩ Current Workflow/business policy
)
AND requested data ∈ Employee current scope
```

任一校验失败都必须写入 Tool Call 状态和标准错误码。

## 7. Hologres Query Tool

Hologres Handler 使用研发维护的固定 SQL 模板和参数绑定：

- SQL 必须显式过滤 `enterprise_id`；
- 非管理员查询显式应用门店或区域 Scope；
- 禁止模型生成 SQL、选择表或拼接排序字段；
- 查询结果包含统计日期和刷新状态；
- 超出范围、行数或时限时拒绝或按契约截断。

当前 POC Tool：

| Tool | 职责 |
|---|---|
| `query_knowledge_base` | 查询口径和知识表 |
| `query_risk_stores` | 查询风险门店和风险命中 |
| `query_common_issues` | 查询共性检查项问题 |
| `query_rectification_progress` | 查询整改进度分析数据 |
| `generate_followup_plan_draft` | 生成不落业务系统的跟进草稿 |

## 8. Internal API Tool

Java Handler 调用 `/internal/agent/**` 专用接口，不复用 Web Controller、浏览器 Token 或 `UserHolder`。每次请求携带服务签名和可信执行上下文。

查询类候选：

| Tool | 业务事实 |
|---|---|
| `get_risk_alert_detail` | 风险日记录和命中原因 |
| `get_risk_rule_definition` | 当前租户规则和 Agent 策略 |
| `get_store_basic_info` | Java 权威门店、区域和状态；不等同于 Agent Store Profile |
| `get_store_responsible_people` | 店长、责任督导和人员有效性 |
| `get_patrol_record_detail` | 巡店记录和检查项事实 |
| `get_check_item_failure_history` | 检查项历史失败 |
| `get_rectification_history` | 历史整改和复发 |
| `get_open_workorders` | 未完成 Question |
| `get_question_order_status` | Question 与任务载体当前状态 |
| `get_agent_command_result` | Java 命令权威结果 |

接口返回必须保留业务状态原值和稳定对象引用，Agent 不重建 Java 状态枚举。

## 9. 草稿 Tool

草稿 Tool 只保存 Agent Artifact，不产生正式业务对象，例如：

- `draft_question_order`；
- `draft_supervisor_reminder`；
- `generate_followup_plan_draft`。

首期不发布主动催办或独立 `send_message` Tool。Workflow 完成 Webhook 是固定系统能力，不进入 Tool Catalog，也不由模型规划。

## 10. Action Tool

### 10.1 `create_question_order`

前置条件：

- Case、员工和 Scope 当前有效；
- 审批未过期且 `request_digest` 一致；
- 店长和当前责任督导解析成功；
- Question 类型、SLA 和事实模板由后端确定；
- 幂等键为 `agent-question:{enterpriseId}:{caseId}:v1`。
- 请求包含与动作、审批、Scope 版本和 `request_digest` 一致的签名授权断言。

同一键重复请求返回原业务对象；同键参数不同返回冲突。业务结果未知时只调用命令查询，不直接重发。

### 10.2 `sync_check_item_ai_rule_config`

输入由后端从不可变验证版本构造，至少包含验证版本、Baseline 摘要、候选摘要、白名单配置和幂等键。

Gateway 校验：

- 验证版本属于当前租户和检查项；
- 正式验收完成；
- 推荐、普通例外或高风险门槛；
- 审批人与申请人规则；
- 候选摘要和白名单字段；
- 当前生产配置未与 Baseline 冲突。

非实验字段如结果项、Question 流程、策略时段和门店范围不得同步。

### 10.3 Agent 图片裁决动作

逐图分析和人工复核是 Agent Service 内部能力。只有人工确认违规后，才调用 Java 确认或创建同一 Period 唯一 `aiInspection` Question。

该动作不得修改平台图片结果、Period 结果、现有复核待办或已有 Question 内容。

## 11. 审批策略

审批记录必须绑定：

- 动作类型和版本；
- 业务对象和租户；
- `request_digest`；
- 申请人、审批人和权限；
- 创建、过期和决定时间；
- 决定结果和原因。

普通推荐规则同步允许检查项管理员单人确认。普通例外和高风险同步要求另一位具备相应权限的用户二次审批。高风险硬门槛不因审批而豁免。

## 12. 幂等与结果未知

Action Tool 记录状态：

```text
PENDING -> RUNNING -> SUCCEEDED
                   -> REJECTED
                   -> FAILED
                   -> RESULT_UNKNOWN
```

处理 `RESULT_UNKNOWN`：

1. 不再次提交原业务动作；
2. 使用原幂等键查询 Java 命令记录；
3. 找到业务对象则提交成功并保存引用；
4. 确认无副作用且需要重新发起时，由 Workflow 创建新的逻辑命令和新键。

原键失败或未知后不能自动重执行业务。

## 13. 错误模型

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "store is outside effective scope",
    "retryable": false
  }
}
```

标准错误码至少包括：

```text
INVALID_ARGUMENT
SCHEMA_VALIDATION_FAILED
TOOL_NOT_ALLOWED
PERMISSION_DENIED
TENANT_MISMATCH
DATE_RANGE_TOO_LARGE
LIMIT_TOO_LARGE
DATA_NOT_FRESH
APPROVAL_REQUIRED
APPROVAL_EXPIRED
APPROVAL_MISMATCH
IDEMPOTENCY_CONFLICT
BUSINESS_CONFLICT
DOWNSTREAM_TIMEOUT
RESULT_UNKNOWN
PROVIDER_UNAVAILABLE
REPLAY_REJECTED
```

错误响应不包含 SQL、内部 URL、Secret、Token 或堆栈。

## 14. 超时、重试和熔断

- 查询 Tool 可在明确的短超时和次数内重试；
- 写 Tool 不对未知结果自动重试；
- Schema、权限、审批和业务冲突不重试；
- Provider 连续失败可触发熔断和降级；
- MCP 未来若接入，使用独立超时、凭证和熔断，不影响内部 Provider。

## 15. 审计与用量

`agent_tool_call` 至少记录 Tool、版本、Run、员工、租户、输入摘要、状态、错误、耗时、审批、幂等键、业务引用和证据引用。

模型 Usage 按每次实际 Provider 请求记录，不合并到 Tool Call 估算。Tool 可以关联触发其调用的 Provider Request，便于回放和成本归因。

## 16. Tool Catalog

Catalog 只注册通过 Schema、Handler、权限、风险和审计校验的 Tool Definition。首期 Tool 由平台发布，租户不能新增或修改。

发布状态：

```text
DRAFT -> REVIEWED -> PUBLISHED -> DEPRECATED -> DISABLED
```

运行中的 Workflow 使用固化的 Tool 版本或兼容契约；禁用高风险 Tool 时可立即阻断新调用。

## 17. MCP 适配边界

首期不实现外部 MCP Client、工具发现或动态注册。未来 `McpToolProvider` 必须继续经过同一个 Tool Gateway，并满足：

- MCP 凭证不暴露给模型；
- 外部 Tool 映射为平台审核过的固定 Contract；
- 动态发现结果不能直接发布；
- 租户、Scope、结果大小、超时和审计规则不因协议改变；
- 外部 MCP 不承担好多店最终权限和安全边界。

## 18. AI 店长 Tool 与隐私投影

首期 `store_manager_review` 只开放以下受控 Tool：

| Tool | 返回 |
|---|---|
| `query_store_snapshot` | 主门店状态、风险、巡店、Question 和整改事实 |
| `query_store_history` | 主门店固定历史窗口的趋势和异常 |
| `query_store_memory` | 主门店的记忆事件摘要、最终复审和 `FALSE_POSITIVE` 结论 |
| `query_store_profile` | 主门店画像的巡店分区、标签分区、版本和来源摘要 |
| `query_store_rank_projection` | 主门店自己的排名、样本量、百分位、指标、时间范围和来源 |
| `generate_store_weekly_report_draft` | 主门店周报草稿 Artifact |

`query_store_rank_projection` 的 `primary_store_id` 和 `ranking_population_scope` 由后端注入。直接所属区域有效门店数达到 10 家时按直接区域计算，少于 10 家时按上上级区域计算；不继续向更上层扩展。查询在数据源或 Handler 内完成聚合，只返回主门店排名投影，不把同区域其他门店行交给 Gateway、模型或普通日志。画像 Tool 首期只返回 `PATROL` 和 `TAG` 分区，未来领域必须显式声明口径和权限后再加入。

AI 店长请求非 `primary_store_id` 门店详情、伪造门店 ID、要求返回排行明细或调用写 Tool 时，Gateway 返回 `PERMISSION_DENIED`/`TOOL_NOT_ALLOWED` 并记录拒绝审计。门店记忆查询同样按主门店和员工 Scope 强制过滤，不能依赖 Prompt 保证隐私。
