# Agent Service 设计

> **版本**：V0.1
> **状态**：设计基线
> **日期**：2026-07-17

## 1. 服务定位

Agent Service 是独立 Python/FastAPI 服务，负责 AI 员工运行、Workflow、Run、Case、审批、Tool 调用、模型 Provider、审计和用量。Java 业务系统继续负责组织权限和业务状态机，Hologres 负责分析数据。

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
  approvals/           # 动作审批和人工裁决
  validations/         # 数据集、验证版本、逐图结果和配置同步
  integrations/        # Hologres、Java Internal API、Webhook
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

ToolExecutionContext
  run_id
  tool_call_id
  enterprise_id
  employee_id
  skill_code
  workflow_code
  allowed_store_ids / region_ids
  approval_id?
  idempotency_key?
```

可信字段由服务端注入，不能从模型参数或前端请求体接受覆盖。

## 4. Workflow 与 Runtime

Workflow Engine 位于 Responses Runtime 上层：

1. Scheduler 或 API 解析 Trigger；
2. 加载员工并计算实时有效 Scope；
3. 创建 Workflow Instance 和初始 Step；
4. AI Step 创建 Run 并调用 `RunnerService`；
5. `ResponsesRuntime` 完成模型与 Tool Loop；
6. 输出通过 Schema 和证据检查后提交 Step；
7. Workflow Engine 执行确定性路由、等待或审批；
8. Case 保存事件和下一次跟进计划。

一个 Step 可关联多个 Run。Runtime 不负责长期等待、Case 关闭或外部业务终态判断。

## 5. AI Employee 与 Scope

员工配置、Credential 和 Scope 版本由 Agent Service 维护。后台调度不依赖创建人 Session。

启动和恢复时检查：

- 员工、Role 和 Skill 均启用；
- 人工负责人有效且覆盖员工 Scope；
- Credential 有效；
- Trigger 和对象属于员工租户；
- 实际 Scope 与员工配置、人工发起人权限和风险策略一致。

Scope 收缩后停止范围外 Case 自动执行；扩大 Scope 不修改运行中实例快照。写动作前始终重新校验当前 Scope。

## 6. Responses Runtime

Runtime 保留当前职责：

- 调用内部 `ResponsesProvider`；
- 解析模型 Tool Call；
- 通过 Tool Gateway 执行工具；
- 维护一次 Run 的响应上下文；
- 检查证据覆盖和结构化输出；
- 保存 Run、Tool Call 和最终输出。

首期三个模型共用百炼 Responses Adapter。Provider、模型和参数在 Run 创建时固化；跨模型降级由后端策略触发并审计，模型不能自行切换。

## 7. Tool Gateway 与 Provider

首期实现：

- `BuiltinToolProvider`：固定 SQL 查询 Hologres 和知识表；
- `InternalApiToolProvider`：调用 Java `/internal/agent/**`；
- `DraftToolProvider`：生成不落业务系统的结构化草稿。

`McpToolProvider` 只保留接口边界，不实现外部连接。Gateway 负责身份、Scope、工具白名单、输入限制、审批、幂等、数据新鲜度和审计。

## 8. Case 与定时恢复

Case Service 维护 Case、Case Event、业务引用和复发关系。`FollowupScheduler` 默认每 6 小时扫描到期且未关闭 Case，创建恢复任务并使用实时 Scope 查询 Java 权威状态。

查询失败不更新业务结论；结果未知先按幂等键查询命令记录；只有确定性关闭条件满足时才能提交 `CLOSED`。

## 9. 审批与人工裁决

审批记录绑定动作类型、业务对象、参数摘要、版本摘要、申请人、审批人、有效期和结果。执行前重新计算摘要，参数变化使审批失效。

Agent 图片复核和规则版本发布使用独立业务语义，但复用统一的身份、权限、并发、审计和恢复基础设施。

## 10. 规则验证

Validation 模块维护：

- 数据集及冻结版本；
- Baseline 和候选版本；
- Prompt、标准图、模型和参数快照；
- 逐图执行、错误和 Token；
- 指标报告和失败样例；
- 推荐、例外和高风险门槛；
- 配置同步请求、审批和前后快照。

候选配置由不可变版本确定性构造，模型不能填写同步参数。生产同步只能经 Tool Gateway 和 Java 受控接口。

## 11. Workflow 完成 Webhook

`WorkflowWebhookService` 在 Workflow 首次提交 `COMPLETED` 后创建异步投递任务。投递读取该实例固化的 `employee_id` 所绑定配置。

实现约束：

- 每员工最多一个 HTTPS URL 和独立 Secret；
- 总超时 5 秒；
- HMAC-SHA256 签名；
- 失败不重试，只写运行日志；
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

## 12. 持久化

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
agent_followup_schedule
agent_audit_log
agent_usage_meter
agent_feedback
```

Validation、图片辅助结果和人工复核表同样使用 `agent_` 前缀。模型 Provider 的上下文标识不能替代 Run、Workflow、Case 或审计记录。

## 13. 事务与并发

- Workflow/Step 状态和对应输出在同一事务提交；
- Worker 使用租约和版本号避免并发执行同一实例；
- Trigger、审批、业务命令和 Webhook Event 使用唯一幂等键；
- Java 命令结果与 Agent Business Reference 通过可恢复状态衔接，不假设跨服务分布式事务；
- 进程重启后只根据数据库状态恢复，不依赖内存 Session。

## 14. Trace 与 Usage

Trace 顺序关联 Workflow、Step、Run、Provider Request、Tool Call、审批、Case Event、Java Command 和 Webhook Log。

每次实际 Provider 请求独立写 Usage，包含输入、输出、总 Token、耗时、用途和重试序号。Usage 缺失时保存空值和原因，不估算。
