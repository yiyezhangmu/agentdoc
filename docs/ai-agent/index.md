# AI 与 Agent

记录大模型、Agent、MCP、RAG、工具调用和相关框架的学习与实践。

---

## 📑 知识目录

<div class="grid cards" markdown>

- **Chat Completions、Responses API 与 Agents SDK**

  深入理解 OpenAI 三种开发方式的关系与适用场景。

  [阅读 →](openai/chat-completions-responses-agents/index.md)

- **Model Context Protocol (MCP)**

  探索 MCP 的核心概念、架构设计与实际应用案例。

  [阅读 →](mcp/index.md)

- **RAG 检索增强生成**

  知识库构建、向量检索与检索增强生成技术实践。

  [阅读 →](rag/index.md)

</div>

---

## 🔗 核心概念

### 大模型开发演进

| 阶段 | 代表技术 | 特点 |
|------|----------|------|
| 传统接口 | Chat Completions API | 消息式交互，功能有限 |
| 新一代接口 | Responses API | 统一接口，流式响应 |
| Agent 框架 | Agents SDK | 工具调用，自动规划 |

### Agent 架构要素

- **思考模块**：决定下一步行动
- **工具调用**：与外部系统交互
- **记忆管理**：短期/长期记忆
- **规划能力**：多步任务拆解

---

## 💡 学习资源

!!! info "推荐阅读"

    - [OpenAI 官方文档](https://platform.openai.com/docs)
    - [LangChain 文档](https://python.langchain.com)
    - [LlamaIndex 文档](https://www.llamaindex.ai/docs)