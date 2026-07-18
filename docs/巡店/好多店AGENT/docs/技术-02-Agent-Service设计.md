# Agent Service 设计

> **版本**：V0.1
> **状态**：设计基线
> **日期**：2026-07-17

## 1. 服务定位

Agent Service 是独立 Python/FastAPI 服务，负责 AI 员工运行、Workflow、Run、Case、门店记忆/画像、审批、Tool 调用、模型 Provider、审计和用量。Java 业务系统继续负责组织权限和业务状态机，Hologres 负责分析数据。

当前 Demo 已实现 `RunnerService`、自研 `ResponsesRuntime`、`ToolGateway`、`ModelProviderRegistry`、固定查询 Tool 和 MySQL 审计。目标系统在这套基线上渐进扩展。

## 2. 模块结构

```text
app/
  api/                 # Web、内部触发和管理 API
  employees/           # AI 员工、Credential、Scope
  workflows/           # Definition 注册、实例、步骤、调度和恢复
  runtime/             # RunnerService、ResponsesRuntime、Provider
  skills/              # 平台 Skill Definition 和 Schema
  tools/               # Tool Gateway、Catalog、Provider
  cases/               # Case、Event、Business Reference、Follow-up
  memories/            # Store Memory Event、Projection、Store Profile
  approvals/           # 动作审批和人工裁决
  validations/         # 数据集、验证版本、逐图结果和配置同步
  integrations/        # Hologres、DataReadiness、Java Internal API、Webhook
  observability/       # Trace、Audit、Usage、Metrics
  persistence/         # Repository、事务和租约
```

模块间通过明确 Service/Repository 契约协作，不允许 Skill 或模型绕过 Tool Gateway 访问数据源。

## 3. 执行上下文

每次 Workflow 和 Run 使用后端构造的可信上下文：

```text
WorkflowExecutionContext
  workflow_instance_id
  case_id?
  enterprise_id
  employee_id
  role_version
  skill_versions
  scope_snapshot
  trigger_type / trigger_id
  initiated_by?
  definition_snapshot_sha256
  primary_store_id?
  profile_snapshot_id?

ToolExecutionContext
  run_id
  tool_call_id
  enterprise_id
  employee_id
  skill_code
  workflow_code
  allowed_store_ids / region_ids
  primary_store_id?
  ranking_population_scope?
  approval_id?
  idempotency_key?
```

可信字段由服务端注入，不能从模型参数或前端请求体接受覆盖。

## 4. Workflow 与 Runtime

Workflow Engine 位于 `AgentRuntime` 上层：

1. Scheduler 或 API 解析 Trigger；
2. 加载员工独立 Scope，并结合当前区域、门店和风险策略计算有效范围；
3. 创建 Workflow Instance 和初始 Step；
4. AI Step 创建 Run 并调用 `RunnerService`；
5. 首期目标 `ResponsesRuntimeAdapter` 完成模型与 Tool Loop；
6. 输出通过 Schema 和证据检查后提交 Step；
7. Workflow Engine 执行确定性路由、等待或审批；
8. Case 保存事件和下一次跟进计划。

一个 Step 可关联多个 Run。Runtime 不负责长期等待、Case 关闭或外部业务终态判断。

## 5. AI Employee 与 Scope

员工配置、Credential 和 Scope 版本由 Agent Service 维护。创建员工时从所选人工负责人当时的权限中复制子集，保存后成为员工独立 Scope；后台调度不依赖负责人或创建人 Session。

启动和恢复时检查：

- 员工、Role 和 Skill 均启用；
- Credential 有效；
- Trigger 和对象属于员工租户；
- 自动任务的有效 Scope 不超过员工当前独立 Scope；人工任务还必须与发起人实时权限取交集；
- AI 店长 `primary_store_id` 属于有效 Scope，且明细查询只允许该门店。

负责人后续状态和权限变化不参与运行时 Scope 计算。租户管理员显式收缩 Scope 后停止范围外 Case 自动执行；扩大 Scope 不修改运行中实例快照。写动作前始终重新校验员工当前独立 Scope。

`REGIONS` 动态展开时，每次 Run 保存实际门店集合、`scope_version` 和区域树差异。新增门店或区域树调整只记录审计和扩张告警，不修改已固化的 Run/Workflow 范围；恢复执行取实例 Scope 快照与员工当前独立 Scope 的交集。

## 6. AgentRuntime 与 Responses Adapter

当前 POC 的 `RunnerService` 直接创建 `ResponsesRuntime`。首期实施新增 `AgentRuntime` 公共契约，以 `ResponsesRuntimeAdapter` 包装现有 Runtime，并通过 `RuntimeFactory` 或构造注入交给 `RunnerService`；未来可替换为 `OpenAIAgentsSdkRuntimeAdapter`。契约输入为 `RunContext`、`SkillSnapshot`、经过 Workflow 校验并固化的 `RuntimeInput` 和 `ToolDefinition`，输出为 `RuntimeResult`；Workflow、Trace、Usage、Tool Gateway 和结构化 Schema 不依赖具体 Runtime。

当前 Runtime 保留职责：

- 调用内部 `ResponsesProvider`；
- 解析模型 Tool Call；
- 通过 Tool Gateway 执行工具；
- 维护一次 Run 的响应上下文；
- 检查证据覆盖和结构化输出；
- 保存 Run、Tool Call 和最终输出。

Runtime 不负责 Workflow 长期等待、Case 关闭、审批决定、Scope 计算或 Java 业务状态。每次实际 Provider 请求都记录 `input_tokens`、`output_tokens`、`total_tokens`、耗时、模型和状态；Provider 缺少 Usage 时保留空值和原因，不估算。这里的输入/输出仅指 Token 计数，不保存原始请求或响应正文。

首期三个模型共用百炼 Responses Adapter。Provider、模型和参数在 Run 创建时固化；跨模型降级由后端策略触发并审计，模型不能自行切换。

## 7. Tool Gateway 与 Provider

首期实现：

- `BuiltinToolProvider`：固定 SQL 查询 Hologres 和知识表；
- `InternalApiToolProvider`：调用 Java `/internal/agent/**`；
- `DraftToolProvider`：生成不落业务系统的结构化草稿。

`McpToolProvider` 只保留接口边界，不实现外部连接。Gateway 负责身份、Scope、工具白名单、输入限制、审批、幂等、数据新鲜度和审计。

`DataReadinessProvider` 是数据源就绪状态的逻辑适配器，按租户、`dataset_code` 和 `stat_date` 返回刷新状态、批次、完成时间、数据截止点和原因。它不从风险结果表是否有行推断刷新成功；实际映射现有控制表、任务日志或最小分区状态记录。

## 8. Case 与定时恢复

Case Service 维护 Case、Case Event、业务引用和复发关系。`FollowupScheduler` 默认每 6 小时扫描到期且未关闭 Case，创建确定性恢复任务并使用实时 Scope 查询 Java 权威状态；该任务默认不创建模型 Run。

查询失败不更新业务结论；结果未知先按幂等键查询命令记录；只有确定性关闭条件满足时才能提交 `CLOSED`。

## 9. 门店记忆与画像

`StoreMemoryService` 将风险事实、门店返回、人工最终复审、误报确认和业务解决结果追加为 `PATROL` 领域门店记忆事件，并生成带 `memory_version` 的当前投影。首期另提供由已确认事件生成的受控 `TAG` 层。事件保存来源对象、发生时间、复审人、理由、证据引用和租户/门店 Scope；更正只追加新事件，不修改历史审计记录。

`StoreProfileService` 将记忆分层投影与当前业务事实确定性汇总为门店画像读模型，明确标注 `profile_version`、生成时间、数据截止时间和各分区来源。后续业绩、客流只新增独立 `domain_code`，不复用巡店字段。

Run 启动时按员工有效 Scope 计算可读取门店集合，并固化 `profile_snapshot_id`；快照内记录 `memory_version`、`profile_version` 和各分区来源。记忆和画像只作为分析输入，不改变 Java 风险、Question、审批或整改状态。AI 店长只允许读取 `primary_store_id` 对应画像，Gateway 不返回其他门店的记忆字段。

## 10. 审批与人工裁决

审批记录绑定动作类型、业务对象、`request_digest`、版本摘要、申请人、审批人、有效期和结果。执行前重新计算 `request_digest`，参数变化使审批失效。

风险 Question 创建前的审批人取 Workflow Instance 所绑定 AI Employee 当前配置的人工负责人。负责人账号失效或没有该动作审批权限时，相关 Case 进入 `WAITING_MANUAL_ASSIGNMENT`；员工、独立 Scope、其他 Workflow 和只读分析不受影响。Java Question 创建后的店长整改和当前督导审批仍由 Java 业务流程维护。

Agent 图片复核和规则版本发布使用独立业务语义，但复用统一的身份、权限、并发、审计和恢复基础设施。

## 11. 规则验证

Validation 模块维护：

- 数据集及冻结版本；
- Baseline 和候选版本；
- Prompt、标准图、模型和参数快照；
- 逐图执行、错误和 Token；
- 指标报告和失败样例；
- 推荐、例外和高风险门槛；
- 配置同步请求、审批和前后快照。

候选配置由不可变版本确定性构造，模型不能填写同步参数。生产同步只能经 Tool Gateway 和 Java 受控接口。

## 12. Workflow 完成 Webhook

`WorkflowWebhookService` 在 Workflow 首次提交 `COMPLETED` 后创建异步投递任务。投递读取该实例固化的 `employee_id` 所绑定配置。

实现约束：

- 明确标记为 Best Effort；
- 每员工最多一个 HTTPS URL 和独立 Secret；
- 总超时 5 秒；
- HMAC-SHA256 签名；
- 失败不重试，只写运行日志；
- 不提供重放接口；
- 不创建独立投递状态机；
- 不因投递结果改变 Workflow 或 Case；
- 其他终态不投递。

请求头：

```text
X-Agent-Event-Id
X-Agent-Timestamp
X-Agent-Signature
```

签名值为 `hex(HMAC-SHA256(secret, timestamp + "\n" + SHA256(raw_body)))`。Payload 只包含 `event_id`、`event_type=workflow.completed`、`enterprise_id`、`employee_id`、`workflow_instance_id`、可空 `case_id`、`status=COMPLETED`、结果摘要、业务引用和 `completed_at`。

## 13. 持久化

核心表统一使用 `agent_` 前缀：

```text
agent_employee
agent_employee_scope_version
agent_employee_credential
agent_workflow_instance
agent_workflow_step_instance
agent_run
agent_tool_call
agent_final_answer
agent_case
agent_case_event
agent_case_business_ref
agent_approval
agent_idempotency_record
agent_schedule_scan_record
agent_followup_schedule
agent_audit_log
agent_usage_meter
agent_feedback
```

Java 业务库的写命令与授权断言消费记录不属于 Agent Service 主数据，但必须作为跨服务事实关联：

```text
agent_command_record_${enterpriseId}
agent_authorization_assertion_record_${enterpriseId}
```

前者以命令幂等键保存业务执行结果，后者以 `agent_client_id + assertion_jti` 保存每次授权断言的消费结果；合法网络重试使用新 `jti`，不能依赖命令表中的单个 `assertion_jti` 字段。

Validation、图片辅助结果和人工复核表同样使用 `agent_` 前缀。模型 Provider 的上下文标识不能替代 Run、Workflow、Case 或审计记录。

门店记忆建议使用以下 Agent 侧记录（实际 DDL 在实现阶段核验）：

```text
agent_store_memory_event
agent_store_memory_projection
agent_store_profile_snapshot
```

事件表追加写入，投影表由事件重放或事务内更新得到，画像快照记录各领域/层的版本、来源和 Run 实际读取范围。原始图片只保存受控引用；完整 Provider 请求和原始响应默认不进入生产长期持久化，结构化最终结果仍按审计要求保存。Usage 表只保存 Token 计数、模型、耗时、摘要和哈希。

## 14. 事务与并发

- Workflow/Step 状态和对应输出在同一事务提交；
- Worker 使用租约和版本号避免并发执行同一实例；
- Trigger、审批、业务命令和 Webhook Event 使用唯一幂等键；
- Java 命令结果与 Agent Business Reference 通过可恢复状态衔接，不假设跨服务分布式事务；
- 进程重启后只根据数据库状态恢复，不依赖内存 Session。

## 15. Trace 与 Usage

Trace 顺序关联 Workflow、Step、Run、Provider Request、Tool Call、审批、Case Event、Java Command 和 Webhook Log。

每次实际 Provider 请求独立写 Usage，包含 `input_tokens`、`output_tokens`、`total_tokens`、耗时、用途和重试序号。Usage 缺失时保存空值和原因，不估算。
