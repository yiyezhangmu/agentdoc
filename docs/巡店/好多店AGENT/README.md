# 好多店 AGENT业务执行系统文档包

> **版本**：V0.1
> **状态**：产品方案评审完成，进入接口与实施设计
> **Java 代码基线**：`coolcollege-intelligent master@3847998dd2`

## 阅读顺序

### 白皮书

1. [项目功能与技术架构介绍](docs/白皮书-好多店AI业务项目功能规划与技术架构.md)：首期业务功能、流程、技术架构、Runtime 路线和安全边界总览。

### 需求

1. [产品需求](docs/需求-01-产品需求.md)：目标、范围、功能需求和验收标准。
2. [AI 岗位与领域模型](docs/需求-02-AI岗位与领域模型.md)：Role、AI Employee、Skill、Workflow、Run、Case 等对象定义。

首期包含 AI 风险督导和 AI 店长。AI 店长的首期能力名为“门店运营执行复盘”，技术编码为 `store_manager_review`，周报 Workflow 为 `store_manager_weekly_report`。每名 AI 店长绑定唯一主门店，区域范围只用于排行聚合。门店记忆按 `PATROL` 巡店层和 `TAG` 标签层沉淀，最终形成 Store Profile 门店画像；业绩、客流等领域只在后续扩展时接入。

### 技术

1. [总体设计](docs/技术-01-总体设计.md)：系统架构、职责、安全边界、Runtime 和部署关系。
2. [Agent Service 设计](docs/技术-02-Agent-Service设计.md)：服务模块、执行上下文、持久化和恢复。
3. [Skill 体系设计](docs/技术-03-Skill体系设计.md)：Skill Contract、Schema、版本和评估。
4. [Workflow 流程设计](docs/技术-04-Workflow流程设计.md)：状态、步骤、Case、审批和执行快照。
5. [Tool 与 Gateway 设计](docs/技术-05-Tool与Gateway设计.md)：Tool Contract、权限、幂等和 Provider。
6. [业务系统对接](docs/技术-06-业务系统对接.md)：Java 内部接口、HMAC、命令和事务边界。
7. [ADR-001 Runtime 路线](docs/技术-07-ADR-001-Agent-Runtime路线.md)：自研 Responses Runtime 与未来 Runtime Adapter 的公共边界。

### 测试

1. [系统验收计划](docs/测试-01-系统验收计划.md)：功能、接口、安全、可靠性和灰度验收。
2. [AI 检查项规则验证](docs/测试-02-AI检查项规则验证.md)：现有 AI 巡店效果测试工具的数据集、Baseline、指标、发布门槛和 Period 快照测试。

### 参考

1. [AI 巡店代码与数据分析](docs/参考-01-AI巡店代码与数据分析.md)：当前 Java 代码、事务表、状态口径和一致性风险。

## 文档职责

| 分类 | 回答的问题 | 不包含 |
|---|---|---|
| 需求 | 为什么做、做什么、业务边界和验收标准 | API、表、状态机实现和测试步骤 |
| 技术 | 如何实现、接口和数据如何流转 | 产品背景复述和完整测试用例 |
| 测试 | 如何验证、需要哪些数据和证据 | 新产品决策和实现设计 |
| 参考 | 当前代码和数据事实是什么 | 未来产品方案 |

需求使用 `FR-*` 和 `AC-*` 编号，测试使用 `TC-*`，通过测试文档中的追踪矩阵关联。同一规则只在一个权威位置定义，其他文档使用链接或编号引用。

## 事实优先级

1. 当前 Java 代码、实际 MySQL DDL、Hologres 数据和稳定业务接口；
2. 已确认的产品需求；
3. 技术设计；
4. 测试方案和参考材料。

代码与旧文档冲突时以代码为事实来源；新的产品取舍以需求评审结论为准。Store Profile 是门店记忆和当前业务事实的只读汇总，不替代 Java 事实源。实际 DDL、索引、生产配置、权限入口和状态码仍需在授权环境只读核验。

## 实施输入

用户实施前提供：

```text
pilot_enterprise_id=<待提供>
isolation_enterprise_id=<待提供>
```

- `pilot_enterprise_id`：实际业务灰度租户；
- `isolation_enterprise_id`：仅用于跨租户隔离负向测试，不启用 Agent，不计入业务试点。

同时补充试点区域、门店、AI 员工、AI 店长主门店、人工负责人和 1 至 3 条风险规则的业务名单。

## 维护规则

- 产品决策变更先更新需求，再同步受影响的技术和测试文档；
- 代码事实变化更新参考文档和对应技术设计；
- 新增、删除或重命名文档后同步本索引、`mkdocs.yml` 和 `MANIFEST.json`；
- `MANIFEST.json` 必须全量重算文件大小和 SHA-256。
