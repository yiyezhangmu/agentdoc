# OpenAI Chat Completions、Responses API 与 Agents SDK

本专题面向团队技术分享，系统介绍 OpenAI 的三种常见开发方式：

- **Chat Completions API**：传统消息式模型接口
- **Responses API**：OpenAI 新一代统一模型接口
- **OpenAI Agents SDK**：建立在模型接口之上的 Agent 运行框架

[打开样式丰富的 HTML 阅读版](./openai_api_team_sharing.html)

---

## 1. 三者处于什么层次

```mermaid
flowchart TB
    SDK["OpenAI Agents SDK<br/>Agent 开发与运行框架"]
    CHAT["Chat Completions API"]
    RESP["Responses API"]
    MODEL["模型调用接口"]

    SDK --> CHAT
    SDK --> RESP
    CHAT --> MODEL
    RESP --> MODEL

    classDef accent fill:#10a37f,color:#ffffff,stroke:#0d7f65,stroke-width:2px;
    class SDK accent;
```

| 技术 | 定位 | 主要作用 |
|---|---|---|
| Chat Completions API | 传统模型接口 | 发送消息历史，获得模型回复或工具调用请求 |
| Responses API | 新一代统一模型接口 | 统一推理、工具、多模态和上下文能力 |
| Agents SDK | Agent 运行框架 | 管理模型调用、工具循环、Session、Tracing 和多 Agent 编排 |

> **核心结论**
>
> Responses API 和 Chat Completions API 都是模型调用接口；Agents SDK 是建立在模型接口之上的 Agent Runtime。

---

## 2. Chat Completions API

### 2.1 基础调用

```python
from openai import OpenAI

client = OpenAI()

response = client.chat.completions.create(
    model="gpt-5.6",
    messages=[
        {
            "role": "developer",
            "content": "你是一个专业的业务分析助手。"
        },
        {
            "role": "user",
            "content": "查询最近7天风险门店。"
        }
    ]
)

print(response.choices[0].message.content)
```

Chat Completions 的核心数据结构是：

```python
messages = [...]
```

每次调用时，应用需要将模型应当知道的上下文按照顺序放入 `messages`。

---

## 3. Chat Completions 的消息角色

常见角色包括：

```text
developer
system
user
assistant
tool
```

## 3.1 developer

`developer` 用于承载开发团队定义的稳定规则：

```json
{
    "role": "developer",
    "content": "你是企业经营数据分析助手。\n\n必须遵守：\n1. 使用中文回答。\n2. 先给管理结论，再给数据依据。\n3. 业务数据必须通过工具查询。\n4. 不允许编造业务数据。\n5. 工具返回权限错误时，不得绕过权限。"
}
```

适合放入：

- 模型身份
- 业务规则
- 输出格式
- 工具调用规则
- 安全限制
- 数据口径
- 禁止事项

## 3.2 system

`system` 是早期 Chat Completions 中常用的系统指令角色：

```json
{
    "role": "system",
    "content": "你是一个专业的业务分析助手。"
}
```

对于较新的 OpenAI 模型，开发者规则通常更适合放入 `developer`。但很多第三方 OpenAI-compatible 接口仍主要使用 `system`。

## 3.3 user

`user` 表示用户输入：

```json
{
    "role": "user",
    "content": "查询最近7天的高风险门店。"
}
```

用户输入属于不可信内容，因此不能仅依赖 Prompt 做权限控制。

## 3.4 assistant

`assistant` 表示模型此前的回答，或者模型发起的工具调用。

普通回答：

```json
{
    "role": "assistant",
    "content": "最近7天共发现3家高风险门店。"
}
```

工具调用：

```json
{
    "role": "assistant",
    "content": null,
    "tool_calls": [
        {
            "id": "call_001",
            "type": "function",
            "function": {
                "name": "query_risk_stores",
                "arguments": "{\"days\":7,\"risk_level\":\"high\"}"
            }
        }
    ]
}
```

## 3.5 tool

`tool` 表示应用执行工具后返回给模型的结果：

```json
{
    "role": "tool",
    "tool_call_id": "call_001",
    "content": "{\"total\":3,\"stores\":[{\"store_id\":\"S001\",\"store_name\":\"杭州西湖店\",\"risk_score\":91}]}"
}
```

`tool_call_id` 必须对应模型此前返回的工具调用 ID。

---

## 4. Chat Completions 的完整多轮历史

```python
messages = [
    {
        "role": "developer",
        "content": "你是企业经营数据分析助手，业务数据必须通过工具查询，禁止编造数据。"
    },
    {
        "role": "user",
        "content": "最近公司的巡店情况怎么样？"
    },
    {
        "role": "assistant",
        "content": "可以从巡店覆盖率、风险门店和整改闭环几个方面分析。"
    },
    {
        "role": "user",
        "content": "先看最近7天风险最高的门店。"
    },
    {
        "role": "assistant",
        "content": None,
        "tool_calls": [
            {
                "id": "call_risk_001",
                "type": "function",
                "function": {
                    "name": "query_risk_stores",
                    "arguments": "{\"start_date\":\"2026-07-08\",\"end_date\":\"2026-07-14\",\"risk_level\":\"high\",\"limit\":10}"
                }
            }
        ]
    },
    {
        "role": "tool",
        "tool_call_id": "call_risk_001",
        "content": "{\"total\":3,\"stores\":[{\"store_id\":\"S001\",\"store_name\":\"杭州西湖店\",\"risk_score\":91}]}"
    },
    {
        "role": "assistant",
        "content": "最近7天共发现3家高风险门店，其中杭州西湖店风险最高。"
    },
    {
        "role": "user",
        "content": "这些门店的整改闭环情况怎么样？"
    }
]
```

“这些门店”之所以能被理解，是因为前面的工具调用、工具结果和模型回答都保留在历史中。

---

## 5. Chat Completions 的工具定义

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "query_risk_stores",
            "description": "查询指定日期范围内的风险门店。",
            "strict": True,
            "parameters": {
                "type": "object",
                "properties": {
                    "start_date": {
                        "type": "string",
                        "description": "开始日期，YYYY-MM-DD"
                    },
                    "end_date": {
                        "type": "string",
                        "description": "结束日期，YYYY-MM-DD"
                    },
                    "risk_level": {
                        "type": "string",
                        "enum": ["low", "medium", "high", "all"]
                    },
                    "limit": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": 100
                    }
                },
                "required": ["start_date", "end_date", "risk_level", "limit"],
                "additionalProperties": False
            }
        }
    }
]
```

工具定义本身不会自动执行数据库查询。

```mermaid
flowchart TD
    A["应用发送 tools"] --> B["模型返回 tool_calls"]
    B --> C["应用执行真实工具"]
    C --> D["应用追加 tool 结果"]
    D --> E["模型生成最终答案"]

    classDef accent fill:#10a37f,color:#ffffff,stroke:#0d7f65,stroke-width:2px;
    class A,E accent;
```

---

## 6. Chat Completions 常用参数

| 参数 | 作用 | 说明 |
|---|---|---|
| `model` | 指定模型 | 不同模型支持的参数和能力不同 |
| `temperature` | 控制随机性 | 数据分析和工具调用通常使用 0～0.3 |
| `top_p` | 核采样 | 通常与 temperature 二选一调整 |
| `stop` | 停止序列 | 不是敏感词过滤，部分模型不支持 |
| `max_completion_tokens` | 限制输出 Token | 不等于字符数 |
| `tool_choice` | 控制工具选择 | 支持 auto、none、强制指定工具 |
| `parallel_tool_calls` | 并行工具调用 | 适合读取，写操作要谨慎 |
| `n` | 候选答案数量 | Agent 场景通常使用 1 |
| `stream` | 流式输出 | 工具参数可能被拆分成多段 |
| `response_format` | 结构化输出 | 优先使用 JSON Schema |
| `store` | 平台存储策略 | 企业应用按合规要求设置 |
| `metadata` | 跟踪元数据 | 不要放敏感信息 |

### 6.1 temperature

```python
temperature=0.2
```

低 temperature 让输出更稳定，但不等于更正确。

### 6.2 top_p

```python
top_p=0.9
```

一般建议与 `temperature` 二选一调整。

### 6.3 stop

更准确的名称是停止序列：

```python
stop=["<END>", "【回答结束】"]
```

它不是敏感词过滤，也不能代替数据脱敏。

### 6.4 max_completion_tokens

```python
max_completion_tokens=1200
```

限制输出 Token，不等于限制中文字数。

### 6.5 tool_choice

```python
tool_choice="auto"
```

```python
tool_choice="none"
```

```python
tool_choice={
    "type": "function",
    "function": {
        "name": "query_risk_stores"
    }
}
```

### 6.6 response_format

```python
response_format={
    "type": "json_schema",
    "json_schema": {
        "name": "risk_store_report",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "summary": {"type": "string"},
                "risk_store_count": {"type": "integer"}
            },
            "required": ["summary", "risk_store_count"],
            "additionalProperties": False
        }
    }
}
```

`tools.parameters` 约束工具参数；`response_format` 约束最终回答格式。

---

## 7. Responses API

### 7.1 基础调用

```python
from openai import OpenAI

client = OpenAI()

response = client.responses.create(
    model="gpt-5.6",
    instructions="你是一个专业的业务分析助手。",
    input="查询最近7天风险门店。"
)

print(response.output_text)
```

主要变化：

```text
messages → input
developer/system → instructions
choices[0].message.content → output_text
```

Responses API 并不只是参数改名，而是重新设计了输入和输出模型。

---

## 8. Responses API 的核心：Item

Chat Completions 主要围绕 Message，Responses API 主要围绕 Item。

一个 Response 的输出可能包括：

- reasoning
- function_call
- message
- web_search_call
- file_search_call
- computer_call

```json
{
  "output": [
    {
      "type": "reasoning"
    },
    {
      "type": "function_call",
      "name": "query_risk_stores",
      "call_id": "call_001",
      "arguments": "{\"days\":7}"
    }
  ]
}
```

---

## 9. Responses API 的多轮上下文

### 9.1 手工传递 input 历史

```python
response = client.responses.create(
    model="gpt-5.6",
    instructions="你是企业经营数据分析助手。",
    input=[
        {"role": "user", "content": "查询高风险门店。"},
        {"role": "assistant", "content": "共有3家。"},
        {"role": "user", "content": "整改情况怎么样？"}
    ]
)
```

### 9.2 previous_response_id

```python
response1 = client.responses.create(
    model="gpt-5.6",
    instructions="你是企业经营数据分析助手。",
    input="查询最近7天高风险门店。"
)

response2 = client.responses.create(
    model="gpt-5.6",
    instructions="你是企业经营数据分析助手。",
    previous_response_id=response1.id,
    input="这些门店整改闭环怎么样？"
)
```

企业系统仍应保存自己的业务会话、工具记录和审计数据。

---

## 10. Responses API 的工具定义

```python
tools = [
    {
        "type": "function",
        "name": "query_risk_stores",
        "description": "查询指定日期范围内的风险门店。",
        "strict": True,
        "parameters": {
            "type": "object",
            "properties": {
                "start_date": {"type": "string"},
                "end_date": {"type": "string"},
                "risk_level": {
                    "type": "string",
                    "enum": ["low", "medium", "high", "all"]
                },
                "limit": {"type": "integer"}
            },
            "required": ["start_date", "end_date", "risk_level", "limit"],
            "additionalProperties": False
        }
    }
]
```

与 Chat Completions 的差异：

```text
Chat Completions: tools[].function.name
Responses API:    tools[].name
```

---

## 11. Responses API 的工具调用结果

```python
for item in response.output:
    if item.type == "function_call":
        print(item.name)
        print(item.arguments)
        print(item.call_id)
```

工具执行完成后：

```json
{
    "type": "function_call_output",
    "call_id": "call_001",
    "output": "{\"total\":3,\"stores\":[...]}"
}
```

| Chat Completions | Responses API |
|---|---|
| `role=tool` | `function_call_output` |
| `tool_call_id` | `call_id` |
| `content` | `output` |

---

## 12. Responses API 常用参数

| 参数 | 作用 |
|---|---|
| `instructions` | 开发者稳定规则 |
| `input` | 当前输入、历史消息和其他 Item |
| `max_output_tokens` | 限制输出 Token |
| `reasoning` | 控制推理投入 |
| `tool_choice` | 控制工具选择 |
| `parallel_tool_calls` | 是否允许并行工具调用 |
| `truncation` | 上下文超限策略 |
| `store` | 平台存储策略 |
| `metadata` | 非敏感跟踪信息 |

示例：

```python
response = client.responses.create(
    model="gpt-5.6",
    instructions="你是企业经营数据分析助手。",
    input="查询最近7天风险门店。",
    tools=tools,
    tool_choice="auto",
    parallel_tool_calls=True,
    max_output_tokens=1200,
    reasoning={"effort": "medium"},
    truncation="disabled",
    store=False,
    metadata={"application": "business-agent"}
)
```

Responses API 没有与传统 `stop` 完全等价的参数，通常通过输出长度、instructions、结构化输出或应用层截断控制。

---

## 13. 参数迁移对照

| Chat Completions | Responses API | 说明 |
|---|---|---|
| `messages` | `input` | 输入历史 |
| `developer/system` | `instructions` | 开发者规则 |
| `choices[0].message.content` | `output_text` | 最终文本 |
| `choices` | `output` | 类型化输出 Item |
| `max_completion_tokens` | `max_output_tokens` | 输出限制 |
| `tools[].function.name` | `tools[].name` | 工具定义位置 |
| `message.tool_calls` | `function_call Item` | 模型发起工具调用 |
| `role=tool` | `function_call_output` | 工具执行结果 |
| `tool_call_id` | `call_id` | 关联工具调用 |
| `response_format` | `text.format` | 结构化输出 |
| `n` | 无直接对应 | Responses 通常一次一份响应 |
| `stop` | 无直接对应 | 通过其他方式控制 |

---

## 14. 两种 API 的根本差异

### Chat Completions

核心单位：

```text
Message
```

执行过程：

```mermaid
flowchart LR
    A["user message"] --> B["assistant message"]
    B --> C["assistant tool_calls"]
    C --> D["tool message"]
    D --> E["assistant message"]

    classDef accent fill:#10a37f,color:#ffffff,stroke:#0d7f65,stroke-width:2px;
    class A,E accent;
```

### Responses API

核心单位：

```text
Item
```

执行过程：

```mermaid
flowchart LR
    A["user message"] --> B["reasoning item"]
    B --> C["function_call item"]
    C --> D["function_call_output item"]
    D --> E["assistant message"]

    classDef accent fill:#10a37f,color:#ffffff,stroke:#0d7f65,stroke-width:2px;
    class A,E accent;
```

Responses API 更适合承载推理、多模态、托管工具、MCP 和 Agent 场景。

---

## 15. OpenAI Agents SDK

Agents SDK 不是新的底层模型 API，而是模型接口之上的 Agent 运行框架。

```python
from agents import Agent, Runner, function_tool

@function_tool
def query_risk_stores(days: int) -> str:
    return "真实业务查询结果"

agent = Agent(
    name="业务分析助手",
    instructions="业务数据必须通过工具查询，禁止编造。",
    tools=[query_risk_stores]
)

result = Runner.run_sync(
    agent,
    "查询最近7天风险门店，并分析主要问题。"
)

print(result.final_output)
```

Agents SDK 主要提供：

- Agent 定义
- Runner
- Tool
- Session
- Guardrails
- Handoffs
- Tracing
- 生命周期管理
- Human in the Loop
- 多 Agent 编排

---

## 16. 直接使用 API 与 Agents SDK 的区别

直接使用 API：

```mermaid
flowchart TD
    A["调用模型"] --> B{"是否有工具调用"}
    B -->|是| C["解析参数"]
    C --> D["执行工具"]
    D --> E["回传工具结果"]
    E --> A
    B -->|否| F["判断任务是否完成"]
    F -->|未完成| A
    F -->|完成| G["返回最终结果"]

    classDef accent fill:#10a37f,color:#ffffff,stroke:#0d7f65,stroke-width:2px;
    class A,G accent;
```

使用 Agents SDK 时，上面的 Agent Loop 通常由 SDK 协助管理。

```mermaid
flowchart TB
    SDK["Agents SDK<br/>Agent 运行框架"]
    API["Chat Completions / Responses API<br/>模型调用接口"]
    MODEL["模型"]

    SDK --> API
    API --> MODEL

    classDef accent fill:#10a37f,color:#ffffff,stroke:#0d7f65,stroke-width:2px;
    class SDK accent;
```

---

## 17. Agents SDK 不会自动解决什么

即使使用 Agents SDK，以下问题仍需业务系统处理：

- 多租户隔离
- 用户身份认证
- 数据权限
- 工具权限
- 写操作审批
- 数据脱敏
- 审计日志
- 幂等控制
- 限流
- 超时
- 业务事务
- 工作流状态
- 高风险操作确认

Agents SDK 是 Agent Runtime，不是完整业务平台。

---

## 18. 三者完整对比

| 对比项 | Chat Completions | Responses API | Agents SDK |
|---|---|---|---|
| 定位 | 传统模型接口 | 新一代统一模型接口 | Agent 运行框架 |
| 核心结构 | Message | Item | Agent / Runner / Tool |
| 普通问答 | 支持 | 支持 | 支持 |
| 多轮对话 | 应用传递 messages | input 或 response 链 | Session |
| 工具调用 | 支持 | 支持 | 支持 |
| 工具执行循环 | 应用自己实现 | 应用自己实现 | SDK 管理 |
| 推理模型支持 | 相对传统 | 更完整 | 使用底层模型能力 |
| 托管工具 | 相对有限 | 重点支持 | 可封装使用 |
| MCP | 通常自行接入 | 支持相关能力 | 更方便集成 |
| 多 Agent | 自己实现 | 自己实现 | Handoff / Agent as Tool |
| Guardrail | 自己实现 | 自己实现 | SDK 提供机制 |
| Tracing | 自己实现 | 请求级 | 运行链路级 |
| 第三方模型兼容 | 最好 | 相对较弱 | 依赖 Provider 适配 |
| 开发工作量 | Agent 场景较大 | 中等 | 相对较小 |

---

## 19. 如何选择

### 普通聊天与文本生成

选择 Chat Completions API，尤其适合需要兼容多个第三方模型的场景。

### 新开发的 OpenAI 应用

优先考虑 Responses API。

### 需要连续调用多个工具

选择 OpenAI Agents SDK。

### 需要兼容国内模型

```mermaid
flowchart LR
    APP["应用"] --> TYPE{"模型类型"}
    TYPE -->|OpenAI 模型| RESP["Responses API"]
    TYPE -->|DeepSeek、通义、智谱等| CHAT["OpenAI-compatible<br/>Chat Completions"]

    classDef accent fill:#10a37f,color:#ffffff,stroke:#0d7f65,stroke-width:2px;
    class APP accent;
```

---

## 20. 最终关系

```mermaid
flowchart TB
    APP["业务应用"] --> SERVICE["Agent 服务"]
    SERVICE --> SDK["OpenAI Agents SDK"]
    SDK --> RUNTIME["Agent Runtime<br/>Agent Loop · Tools · Session<br/>Guardrails · Handoffs · Tracing"]
    RUNTIME --> RESP["Responses API<br/>OpenAI 主要通道"]
    RUNTIME --> CHAT["Chat Completions API<br/>第三方兼容通道"]
    RESP --> OPENAI["OpenAI 模型"]
    CHAT --> THIRD["DeepSeek、通义等"]

    classDef accent fill:#10a37f,color:#ffffff,stroke:#0d7f65,stroke-width:2px;
    class APP,SDK accent;
```

最终记住四句话：

1. Chat Completions 是传统聊天模型接口。
2. Responses API 是 OpenAI 新一代统一模型接口。
3. Agents SDK 是建立在模型接口之上的 Agent 运行框架。
4. 企业权限、数据安全和业务执行边界仍然必须由业务系统控制。
