# 好多店 AI Native 业务执行系统技术设计文档 V0.1

## 1. 文档定位

本文档定义好多店 AI Native 业务执行系统的技术架构设计。

目标：

在现有好多店 SaaS、业务系统、Hologres 数仓基础上，引入 Agent
Runtime、Workflow、Skill、Tool、MCP 等能力，使 AI
从查询助手升级为可执行的业务角色。

现有系统已经具备：

-   门店
-   区域
-   用户组织
-   巡店
-   检查项
-   风险规则
-   整改任务
-   工单
-   Hologres 数仓

因此 AI 系统不重复建设业务能力，而通过工具层连接已有能力。

------------------------------------------------------------------------

# 2. 总体技术原则

## 原则一：业务系统负责事实

业务系统负责：

-   风险产生
-   任务状态
-   工单状态
-   人员关系
-   权限关系

AI 不修改事实。

------------------------------------------------------------------------

## 原则二：AI负责理解和推动

AI负责：

-   分析
-   推理
-   规划
-   建议
-   调度
-   跟进

------------------------------------------------------------------------

## 原则三：Tool Gateway负责安全边界

Agent 不直接：

-   访问数据库
-   修改业务表
-   绕过权限

所有能力通过：

    Agent

    ↓

    Tool Gateway

    ↓

    MCP / API

    ↓

    业务系统

------------------------------------------------------------------------

# 3. 总体架构

                        用户 / 业务事件

                               |

                               v


                  AI Native Agent Service


     ┌────────────────────────────────────┐

     │ Agent Runtime                      │
     │                                    │
     │ - Planner                          │
     │ - Session                          │
     │ - Memory                           │
     │ - Trace                            │
     │ - Guardrails                       │

     └────────────────────────────────────┘


                               |

                               v


                     Workflow Engine


                               |

                               v


                        Skill Layer


                               |

                               v


                      Tool Gateway


                               |

            --------------------------------

            |              |               |

            MCP Tool     API Tool       RAG Tool


                               |

                               v


                    好多店业务系统 / Hologres

------------------------------------------------------------------------

# 4. Agent Service设计

## 4.1 技术定位

独立 Python 服务。

不直接并入 Java SaaS。

原因：

-   Agent生命周期不同
-   模型调用不同
-   便于快速迭代
-   降低主业务风险

------------------------------------------------------------------------

## 4.2 核心模块

    agent-service

    ├── agent_runtime

    ├── workflow

    ├── skill

    ├── tool_gateway

    ├── session

    ├── case

    ├── approval

    ├── trace

    └── model_adapter

------------------------------------------------------------------------

# 5. Agent Runtime设计

负责：

-   接收任务
-   加载上下文
-   调用模型
-   执行规划
-   调用Skill
-   调用Tool
-   输出结果

核心输入：

    Agent Employee

    +
    Workflow

    +
    Context

    +
    User Scope

    +
    Case

------------------------------------------------------------------------

# 6. Workflow设计

Workflow定义业务执行过程。

模型：

    Trigger

    ↓

    Workflow

    ↓

    Step

    ↓

    Skill

    ↓

    Tool

    ↓

    Result

    ↓

    Case

------------------------------------------------------------------------

例如：

风险整改流程：

    risk_alert_created

    ↓

    AI风险督导

    ↓

    风险分析

    ↓

    责任定位

    ↓

    整改建议

    ↓

    人工审批

    ↓

    创建任务

    ↓

    跟踪Case

------------------------------------------------------------------------

# 7. Skill设计

Skill是业务能力单元。

结构：

    Skill

    ├── metadata

    ├── prompt

    ├── input schema

    ├── output schema

    ├── tools

    ├── examples

    └── guard rules

------------------------------------------------------------------------

示例：

## risk_analysis_skill

输入：

``` json
{
 "risk_alert_id":"xxx",
 "store_id":"xxx"
}
```

输出：

``` json
{
 "risk_summary":"",
 "evidence":[],
 "recommendation":""
}
```

------------------------------------------------------------------------

# 8. Tool Gateway设计

职责：

-   权限校验
-   参数校验
-   数据范围控制
-   审计
-   限流

流程：

    Agent

    ↓

    Tool Gateway

    ↓

    检查：

    enterprise_id

    user_scope

    permission

    input

    ↓

    执行Tool

    ↓

    返回结果

------------------------------------------------------------------------

# 9. MCP设计

MCP作为业务能力暴露方式。

例如：

风险查询：

    get_risk_alert_detail

    get_store_profile

    get_patrol_history

    get_task_status

任务：

    create_task_draft

    submit_task

------------------------------------------------------------------------

# 10. 数据架构

数据来源：

## MySQL

负责：

-   业务事务
-   权限
-   配置
-   任务状态

## Hologres

负责：

-   分析查询
-   趋势分析
-   历史数据
-   AI分析上下文

------------------------------------------------------------------------

# 11. Session设计

Session保存：

-   用户上下文
-   对话历史
-   Agent执行状态
-   Workflow状态

建议：

MySQL。

------------------------------------------------------------------------

# 12. Case设计

Case是业务闭环对象。

结构：

    Case

    ├── risk_event

    ├── analysis_result

    ├── task

    ├── approval

    ├── follow_up

    └── close_result

------------------------------------------------------------------------

# 13. 权限设计

必须继承：

    enterprise_id

    region_scope

    store_scope

    role

    user_permission

禁止：

-   用户输入租户ID
-   Agent跨企业查询
-   Tool绕过权限

------------------------------------------------------------------------

# 14. 审计设计

记录：

## Agent Run

一次执行。

## Tool Call

一次工具调用。

## Trace

完整链路。

包括：

-   输入
-   输出
-   模型
-   Skill
-   Tool
-   时间

------------------------------------------------------------------------

# 15. OpenAI Agent SDK适配设计

建议：

Agent Runtime采用 OpenAI Agents SDK。

支持：

-   多模型
-   Responses API
-   Tool Calling
-   Session
-   Trace

模型：

第一期：

DeepSeek 等 OpenAI Compatible 模型。

------------------------------------------------------------------------

# 16. 第一阶段技术范围

实现：

AI风险督导。

包含：

-   Agent Service
-   Workflow
-   Skill
-   Tool Gateway
-   MCP
-   Hologres查询
-   Case
-   审计

不包含：

-   视频AI Agent
-   财务Agent
-   客流Agent

------------------------------------------------------------------------

# 17. Codex辅助开发方式

Codex第一阶段任务：

不是开发。

而是分析：

1.  当前业务代码
2.  数据库
3.  API
4.  Hologres表
5.  权限体系

输出：

-   Tool候选
-   Skill候选
-   Workflow候选
-   数据映射

------------------------------------------------------------------------

# 18. 后续设计文档

下一阶段：

-   Agent Service详细设计
-   MCP Tool清单
-   Skill输入输出规范
-   Workflow表设计
-   Case状态机设计
-   权限模型设计
-   部署架构设计
