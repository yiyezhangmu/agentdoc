# 好多店 AI Native 业务执行系统文档包 V0.1

## 文档顺序

1. 需求文档：说明为什么建设、业务范围与验收目标。
2. 总体设计：说明整体业务架构、系统架构与建设阶段。
3. AI岗位体系规划：定义 Role、AI Employee、Skill、Workflow、Case、Run。
4. 技术设计：定义 Agent Service、Harness、Tool Gateway、数据与安全边界。
5. Agent Service 详细设计：定义服务模块和研发实现骨架。
6. Skill 体系详细设计：定义能力单元、输入输出、Tool 依赖和评估。
7. Workflow 流程详细设计：定义事件触发、步骤、审批、恢复和业务闭环。
8. MCP Tool 设计规范：定义 Tool Contract、Gateway、MCP Adapter、权限、幂等和审计。
9. 业务系统对接规划：定义 Agent Service 与现有 Java 任务、工单、AI 图片、审核、申诉和消息能力的对接边界与实施阶段。
10. AI 巡店业务代码与事务数据分析：基于当前 Java 代码梳理平台自调度 AI 巡店链路、业务对象、事务表和一致性风险。
11. 附录 A：核心对象关系定义。

## 文档入口

- [01-业务执行系统需求文档](docs/01-好多店_AI_Native_业务执行系统需求文档_V0.1.md)
- [02-业务执行系统总体设计](docs/02-好多店_AI_Native_业务执行系统总体设计文档_V0.1.md)
- [03-AI 岗位、AI 员工、Skill、Workflow、Case 整体规划](docs/03-好多店_AI岗位_AI员工_Skill_Workflow_Case整体规划_V0.1.md)
- [04-业务执行系统技术设计](docs/04-好多店_AI_Native_业务执行系统技术设计文档_V0.1.md)
- [05-Agent Service 详细设计](docs/05-好多店_AI_Native_Agent_Service详细设计文档_V0.1.md)
- [06-Skill 体系详细设计](docs/06-好多店_AI_Native_Skill体系详细设计文档_V0.1.md)
- [07-Workflow 流程详细设计](docs/07-好多店_AI_Native_Workflow流程详细设计文档_V0.1.md)
- [08-MCP Tool 设计规范](docs/08-好多店_AI_Native_MCP_Tool设计规范_V0.1.md)
- [09-业务系统对接规划](docs/09-好多店_AI_Native_业务系统对接规划_V0.1.md)
- [10-AI 巡店业务代码与事务数据分析](docs/10-好多店_AI巡店业务代码与事务数据分析_V0.1.md)
- [附录 A-核心对象关系定义](docs/附录A-好多店_AI岗位_AI员工_Skill_流程_Case关系定义_V0.1.md)

## 当前阶段说明

当前文档为 V0.1 设计基线。平台自调度 AI 巡店已按 `coolcollege-intelligent master@3847998dd2` 完成代码级核验；实际数据库 DDL、索引、唯一键、生产调用方和运行数据仍需在详细设计阶段连接授权环境后核验。其余真实表名、API、权限入口、风险事件来源、任务状态和 Case 关闭条件，继续以现有源码、MySQL、Hologres 和业务接口为事实来源进行证据化确认。

已新增确认“AI 检查项规则效果验证与优化”重点场景：用户从历史 AI 巡店结果沉淀带人工真值的数据集，并区分优化集和冻结的验收集；正式验收集不少于 50 张且满足类别最低分布。Agent 建立 Baseline 并生成多个不可变调试版本，对比 Prompt、标准图和模型效果；用户选择版本后通过受控业务接口同步 AI 规则配置。验证过程旁路运行，不改变现有巡店执行逻辑和历史业务结果。

候选版本在“准确率提升至少 6 个百分点或达到检查项目标、`FAIL` Recall 不低于 Baseline、模型错误率不超过 2%”时标记为推荐采用；该标识不自动修改或同步生产配置。

首期主流程：

风险规则系统产生风险记录
→ AI 风险督导接管
→ 风险分析和责任定位
→ 生成整改方案
→ 人工审批
→ 调用现有任务或工单系统
→ 持续跟进
→ 满足业务条件后关闭 Case

首期不包含视频 AI、业绩、客流和财务。
