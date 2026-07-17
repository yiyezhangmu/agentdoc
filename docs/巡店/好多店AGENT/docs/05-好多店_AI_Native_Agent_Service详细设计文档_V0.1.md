# 好多店 AI Native Agent Service 详细设计文档 V0.1

## 1. 文档定位

本文档定义好多店 AI Native 业务执行系统中 Agent Service 的详细技术设计。

Agent Service 是 AI 员工运行平台，负责：

-   接收业务事件
-   加载 AI 员工配置
-   执行 Workflow
-   调用 Skill
-   调用 Tool
-   管理 Session
-   记录 Trace
-   推动 Case 闭环

------------------------------------------------------------------------

# 2. 服务定位

服务名称：

haoduodian-agent-service

定位：

独立 Python 服务。

不直接进入现有 Java 业务核心。

原因：

-   Agent 生命周期不同
-   模型调用独立
-   便于快速迭代
-   降低业务系统风险

------------------------------------------------------------------------

# 3. 总体运行模型

    业务事件

        |

        v

    Agent Service


        |

    AI Employee

        |

    Context Builder

        |

    Workflow Engine

        |

    Skill Runtime

        |

    Tool Gateway

        |

    业务系统 / Hologres / MCP

------------------------------------------------------------------------

# 4. 服务模块设计

    haoduodian-agent-service

    app/

    ├── api

    ├── agent

    ├── employee

    ├── workflow

    ├── skill

    ├── tool

    ├── mcp

    ├── session

    ├── case

    ├── approval

    ├── trace

    ├── memory

    └── model

------------------------------------------------------------------------

# 5. Agent Runtime

负责一次 AI 员工执行。

生命周期：

    Create Run

    ↓

    Load Employee

    ↓

    Build Context

    ↓

    Execute Workflow

    ↓

    Call Skill

    ↓

    Call Tool

    ↓

    Generate Result

    ↓

    Save Trace

    ↓

    Update Case

------------------------------------------------------------------------

# 6. AI Employee模型

AI岗位：

    AI风险督导

AI员工：

    华东区域AI风险督导01

包含：

-   负责范围
-   数据范围
-   权限
-   模型配置
-   Skill集合
-   Workflow配置

------------------------------------------------------------------------

# 7. Harness设计

Harness负责控制 Agent 执行边界。

能力：

## Context注入

包括：

-   enterprise_id
-   user_id
-   role
-   store_scope
-   current_case

## Tool控制

限制：

允许：

-   查询风险
-   查询门店
-   查询任务

禁止：

-   直接SQL
-   修改历史数据

## 执行保护

包括：

-   最大循环次数
-   超时
-   Token限制
-   人工接管

------------------------------------------------------------------------

# 8. Context Builder

作用：

为 AI 员工构建业务上下文。

风险督导示例：

输入：

    risk_alert_id

    store_id

    enterprise_id

生成：

    门店画像

    历史问题

    责任人员

    风险规则

    整改状态

------------------------------------------------------------------------

# 9. Workflow Engine

负责业务流程执行。

模型：

    Workflow

    ↓

    Step

    ↓

    Skill

    ↓

    Tool

    ↓

    Result

风险整改：

    风险事件

    ↓

    风险分析

    ↓

    责任定位

    ↓

    整改方案

    ↓

    人工审批

    ↓

    创建任务

    ↓

    Case跟进

------------------------------------------------------------------------

# 10. Skill Runtime

Skill 是业务能力单元。

结构：

    Skill

    ├── metadata

    ├── prompt

    ├── input_schema

    ├── output_schema

    ├── tools

    └── guard_rules

------------------------------------------------------------------------

示例：

risk_analysis_skill

输入：

    risk_alert_id

输出：

    风险摘要

    证据

    原因分析

    整改建议

------------------------------------------------------------------------

# 11. Tool Gateway

Tool Gateway 是安全边界。

流程：

    Agent

    ↓

    Tool Gateway

    ↓

    权限检查

    ↓

    MCP/API

    ↓

    业务系统

检查：

-   enterprise_id
-   用户权限
-   门店范围
-   参数合法性

------------------------------------------------------------------------

# 12. MCP Client

工具示例：

查询：

    get_risk_alert_detail

    get_store_profile

    get_patrol_history

    get_task_status

动作：

    create_task_draft

    submit_task

------------------------------------------------------------------------

# 13. Session设计

MySQL保存：

    agent_session

    agent_run

    agent_message

    agent_step

    tool_call_log

------------------------------------------------------------------------

# 14. Trace设计

记录完整执行链路。

例如：

    Run001

    Step1:
    risk_analysis

    Tool:
    get_risk_detail

    Step2:
    generate_plan

用于：

-   调试
-   审计
-   模型评估

------------------------------------------------------------------------

# 15. 第一阶段POC

实现：

    risk_alert_created

    ↓

    AI风险督导

    ↓

    查询Hologres

    ↓

    风险分析

    ↓

    生成整改建议

------------------------------------------------------------------------

# 16. 后续扩展

新增 AI 岗位时：

无需修改 Runtime。

只增加：

-   Role
-   Employee
-   Skill
-   Workflow

即可。
