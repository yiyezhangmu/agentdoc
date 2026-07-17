# Jeffrey 知识库：临时总体问答（供 AI 阅读）

> **文件定位**：这是一个临时的项目上下文和交接文档，用于让新的 AI 在开始工作前快速理解仓库。它不属于 MkDocs 正式站点导航，确认不再需要后可以直接删除。
>
> **当前快照**：2026-07-16，仓库位于 `D:\dev\docs-jeffrey`，当前分支为 `main`，远程仓库为 `https://github.com/yiyezhangmu/agentdoc`。
>
> **给 AI 的第一条原则**：先查看当前工作区和真实代码，再修改；当前仓库存在尚未提交的文档、样式、模板和导航变更，不要覆盖或回退已有修改。

---

## 一、项目定位

### Q1：这个项目是什么？

这是 Jeffrey 的本地 Markdown 个人知识库，使用 MkDocs Material 将 `docs/` 下的 Markdown 和 HTML 内容构建为可在浏览器中阅读的网站。

它不是业务后端、Agent 服务或 SaaS 平台，当前主要目标是：

- 在本地集中保存和阅读 Markdown 文档。
- 支持图片、视频、代码块、表格、提示框和 Mermaid 流程图。
- 提供宽屏阅读、全文搜索、浅色/深色切换和章节折叠。
- 通过 Git 和 GitHub 管理内容版本。
- 沉淀 AI、Agent、架构、数据库、DevOps、产品等技术资料。

### Q2：当前最重要的产品诉求是什么？

核心不是“做一个复杂 CMS”，而是做好本地技术文档阅读体验：

1. 页面主体足够宽，适合阅读长代码、表格和流程图。
2. 左侧导航和右侧目录可以分别隐藏，隐藏后正文真正扩宽。
3. Markdown 渲染接近 GitHub Preview，整体配色参考 ChatGPT 的中性黑灰和绿色强调。
4. 图片、视频和 Mermaid 流程图可以自然展示。
5. 代码块尤其是 JSON、Python、SQL 等语言具有清晰高亮和复制按钮。
6. 长文档的二级章节可以折叠，并记住折叠状态。
7. 每个正式 Markdown 页面可以跳转到 GitHub 编辑，并在新窗口打开。

### Q3：这个项目面向谁？

目前主要面向仓库作者本人，是个人技术知识库，不需要复杂的多用户、权限、评论或发布工作流。

### Q4：这个项目目前处于什么阶段？

项目处于“基础站点已可用、阅读体验持续优化、内容逐步补全”的阶段：

- MkDocs 基础站点、导航、搜索、主题切换已经具备。
- 宽屏阅读、左右栏隐藏、章节折叠、代码语言栏和 Mermaid 渲染已经有自定义实现。
- OpenAI API 与 Agent 工程专题内容较完整。
- MCP、RAG 等部分页面仍是占位或简要说明。
- 当前工作区有未提交变更，不能把 Git HEAD 当成全部最新事实。

---

## 二、技术栈与运行方式

### Q5：项目使用什么技术？

| 层次 | 技术 |
|---|---|
| 文档生成器 | MkDocs `1.6.1` |
| 主题 | MkDocs Material `9.*` |
| 内容格式 | Markdown、少量独立 HTML |
| 样式 | 自定义 CSS |
| 交互 | 原生 JavaScript |
| 流程图 | Mermaid 11 |
| 模板覆盖 | Jinja / MkDocs Material overrides |
| 搜索 | MkDocs Material Search，中英文 |
| 版本管理 | Git + GitHub |

项目没有 Node.js 构建流程，没有 React/Vue，也没有数据库或后端服务。

### Q6：依赖安装命令是什么？

```powershell
cd D:\dev\docs-jeffrey
python -m pip install -r requirements.txt
```

`requirements.txt` 当前只包含：

```text
mkdocs==1.6.1
mkdocs-material==9.*
```

### Q7：怎样启动本地站点？

推荐直接运行：

```powershell
cd D:\dev\docs-jeffrey
mkdocs serve -a 127.0.0.1:3164
```

Windows 可以双击根目录下的：

```text
restart.bat
```

Linux 或 macOS 可以运行：

```bash
chmod +x restart.sh
./restart.sh
```

浏览器访问：

```text
http://127.0.0.1:3164/
```

### Q8：`restart.bat` 和 `restart.sh` 做了什么？

两个脚本都会先查找并停止监听 `3164` 端口的旧进程，再从仓库根目录启动：

```text
mkdocs serve -a 127.0.0.1:3164
```

`restart.bat` 使用 Windows 的 `netstat` 和 `taskkill`；`restart.sh` 优先使用 `lsof`，并兼容 `fuser` 或 `pgrep`。服务以前台方式运行，按 `Ctrl+C` 可以停止。

### Q9：怎样构建并验证站点？

```powershell
cd D:\dev\docs-jeffrey
mkdocs build --strict
```

构建输出位于 `site/`。`site/` 是生成目录，已在 `.gitignore` 中排除，不应该手工维护或提交。

### Q10：AI 修改后最少应做什么验证？

1. 运行 `git diff --check`。
2. 运行 `mkdocs build --strict`。
3. 如果修改 CSS、JavaScript、模板或 Mermaid，再启动本地站点进行浏览器检查。
4. 分别检查浅色和深色主题。
5. 涉及宽度或导航时，检查左右侧栏显示、单侧隐藏和双侧隐藏四种状态。
6. 涉及响应式布局时，再检查移动端宽度。

---

## 三、仓库结构

### Q11：根目录主要文件分别是什么？

```text
D:\dev\docs-jeffrey
├─ docs/                  # 正式文档和站点静态资源
├─ overrides/             # MkDocs Material 模板覆盖
├─ site/                  # 构建产物，不提交
├─ mkdocs.yml             # 站点、主题、插件、扩展和导航配置
├─ requirements.txt       # Python 依赖
├─ restart.bat            # Windows 重启脚本
├─ restart.sh             # Linux/macOS 重启脚本
├─ readme.md              # 当前几乎为空，不能作为项目说明真相源
└─ .gitignore
```

### Q12：正式内容放在哪里？

正式站点内容放在 `docs/` 下。主要分类包括：

```text
docs/
├─ index.md
├─ ai-agent/
│  ├─ index.md
│  ├─ agent-engineering/index.md
│  ├─ openai/chat-completions-responses-agents/index.md
│  ├─ openai/chat-completions-responses-agents/openai_api_team_sharing.html
│  ├─ mcp/index.md
│  └─ rag/index.md
├─ architecture/index.md
├─ database/index.md
├─ devops/index.md
├─ product/index.md
├─ miscellaneous/index.md
└─ 巡店/index.md
```

### Q13：站点导航是自动生成的吗？

不是。`mkdocs.yml` 中显式配置了 `nav`。添加 Markdown 文件后：

- MkDocs 可以发现并构建文件。
- 但 `mkdocs.yml` 不会自动变化。
- 新页面不会自动出现在当前手工导航中。
- 如果需要导航入口，必须手工修改 `mkdocs.yml`。

### Q14：目录下的 Markdown 必须叫 `index.md` 吗？

不必须。例如：

```text
docs/ai-agent/demo.md
```

可以生成类似：

```text
/ai-agent/demo/
```

但目录首页通常推荐使用：

```text
docs/ai-agent/demo/index.md
```

这样 URL 更自然：

```text
/ai-agent/demo/
```

`index.md` 主要表示目录默认页，不是 Markdown 本身的强制命名规则。

### Q15：为什么很多分类都使用 `index.md`？

因为它可以让目录本身成为入口页，便于形成“分类目录 → 分类首页 → 子专题”的层次，也能获得较干净的 URL。

### Q16：`docs/assets/` 与 `overrides/assets/` 有什么区别？

当前 `mkdocs.yml` 明确加载的是：

```yaml
extra_css:
  - assets/stylesheets/custom.css

extra_javascript:
  - assets/javascripts/sidebar-toggle.js
  - assets/javascripts/content-enhancements.js
  - assets/javascripts/mermaid-renderer.js
```

因此，当前页面直接使用的是 `docs/assets/` 下的资源。`overrides/assets/` 中存在同名或历史文件，修改前必须确认是否仍被模板引用，不要假设两个目录会自动同步。

### Q17：模板覆盖放在哪里？

`mkdocs.yml` 配置：

```yaml
theme:
  custom_dir: overrides
```

当前主要模板覆盖包括：

- `overrides/partials/header.html`
- `overrides/partials/actions.html`

其中编辑动作链接带有 `target="_blank"`，目标是在新窗口打开 GitHub 编辑页面。

---

## 四、当前导航与内容专题

### Q18：顶层导航有哪些？

当前 `mkdocs.yml` 中配置了：

1. 首页
2. AI 与 Agent
3. 架构设计
4. 数据库
5. DevOps
6. 巡店
7. 产品
8. 其他
9. 本地目录

### Q19：为什么“巡店”目录中的页面标题是“云平台”？

当前存在目录命名和页面内容不一致的过渡状态：

- 导航名称为“巡店”。
- 文件路径为 `docs/巡店/index.md`。
- 页面标题和正文仍是“云平台”。
- 工作区中原 `docs/cloud/index.md` 处于删除状态。

AI 不应擅自判断最终应该叫“巡店”还是“云平台”。如要整理，应先向用户确认目标内容和命名。

### Q20：哪些专题当前内容最完整？

目前最完整的是：

1. `docs/ai-agent/openai/chat-completions-responses-agents/index.md`
2. `docs/ai-agent/agent-engineering/index.md`

前者聚焦 OpenAI 接口和 Agents SDK，后者聚焦提示词、上下文、长期记忆和 Harness 的工程分层。

### Q21：OpenAI 接口专题讲什么？

该专题包括：

- Chat Completions、Responses API 与 Agents SDK 的层次关系。
- Chat Completions 基础调用、消息角色、多轮历史和工具定义。
- `developer`、`system`、`user`、`assistant`、`tool` 的职责。
- 消息顺序不是严格交替，工具调用时最后一条可能是 `tool`。
- 常用生成参数和 Structured Outputs。
- Responses API 的 Item、上下文、工具输入输出和参数迁移。
- Agents SDK 默认使用 Responses API，同时保留 Chat Completions 兼容实现。
- 直接调用 API 与使用 Agent Runtime 的差异。
- 企业权限、安全和业务边界不能交给模型或 SDK 自动解决。

### Q22：Agent 工程专题讲什么？

该专题把 Agent 应用拆成四类工程问题：

| 工程层 | 核心问题 |
|---|---|
| 提示词工程 | 怎样让模型理解任务并按格式回答？ |
| 上下文工程 | 本次调用应该让模型看到什么？ |
| 长期记忆 | 怎样跨会话保存、更新和找回信息？ |
| Harness 工程 | 怎样组织运行、工具、安全、评测和可观测性？ |

专题还纠正了以下常见误解：

- `seed` 不是 Harness 测试框架，而且在 Chat Completions 中已标记 deprecated。
- `logit_bias` 是 Token 概率偏置，不是可靠的业务禁词机制。
- `logprobs` 是 Token 对数概率，不等于答案正确率。
- `max_completion_tokens` 限制输出，不会自动解决输入上下文过长。
- RAG 不等于完整长期记忆。

### Q23：MCP 和 RAG 页面成熟吗？

目前不成熟：

- `docs/ai-agent/mcp/index.md` 只有标题。
- `docs/ai-agent/rag/index.md` 只有简短说明。

AI 可以把它们视为待扩展专题，但不应假装当前已有完整内容。

### Q24：架构、数据库、DevOps、产品和其他页面是什么状态？

这些页面已有分类框架、概念表格、示例和实践建议，适合作为知识目录首页，但深度仍低于 OpenAI 和 Agent 工程专题。

---

## 五、页面视觉与阅读体验

### Q25：当前视觉方向是什么？

视觉方向是“ChatGPT 式中性界面 + GitHub 式 Markdown 与代码高亮”：

- 强调色：`#10a37f`。
- 深色页面：`#212121`。
- 深色导航：`#171717`。
- 深色内容表面：`#2f2f2f`。
- 深色正文：`#ececec`。
- 浅色页面：白色和浅灰。
- 代码高亮：使用接近 GitHub Light / Dark 的语法色。
- 避免大面积蓝色渐变、强阴影和过度装饰。

### Q26：字体是什么？

CSS 使用本地字体回退，不主动依赖外部字体服务：

```css
--md-text-font: "Inter", "Segoe UI", system-ui, sans-serif;
--md-code-font: "JetBrains Mono", "Cascadia Code", Consolas, monospace;
```

系统未安装首选字体时，会自动回退。

### Q27：页面宽度如何设计？

当前 `.md-grid` 最大宽度为 `118rem`，正文 `.md-content` 不设置固定最大宽度。左右导航同时隐藏时，最大宽度进一步允许到 `126rem`，以便阅读长代码、宽表格和流程图。

### Q28：左右导航如何隐藏？

`docs/assets/javascripts/sidebar-toggle.js` 会在页面左右边缘创建两个固定按钮：

- 左侧按钮控制主导航。
- 右侧按钮控制当前页目录。
- 状态保存在 `localStorage`。
- 页面刷新或即时导航后继续生效。
- 隐藏后会在 `body` 上增加 `sidebar-hidden` 或 `toc-hidden` 类。
- CSS 根据这些类真正移除侧栏并扩宽正文。

### Q29：章节折叠如何实现？

同一个 `sidebar-toggle.js` 会扫描正文中的 `h2[id]`：

- 在每个二级标题后增加折叠按钮。
- 点击标题或按钮可以折叠该章节直到下一个 `h2` 之前的内容。
- 折叠状态按“页面路径 + 标题 ID”保存到 `localStorage`。
- 页面刷新后仍保留。

这不是 Markdown 标准语法，而是前端增强功能。

### Q30：浅色和深色如何切换？

使用 MkDocs Material 的 `palette` 配置：

- 初始可以跟随系统 `prefers-color-scheme`。
- 用户可以手动切换。
- 两种主题都有独立 CSS 变量。

修改样式时必须同时检查 `default` 和 `slate` 两种 scheme。

### Q31：代码块有什么增强？

`content-enhancements.js` 会：

- 查找 `.md-typeset .highlight` 代码块。
- 从 `language-*` 类读取语言。
- 显示 `Python`、`JSON`、`SQL`、`PowerShell` 等语言标签。
- 把 MkDocs 自带复制按钮移动到代码头部右侧。
- 兼容 MkDocs Material 即时导航的 `document$`。

### Q32：代码样式的目标是什么？

目标接近 GitHub Markdown Preview：

- 浅色代码背景使用 `#f6f8fa`。
- 深色代码背景使用 GitHub Dark 风格色值。
- 代码容器有语言栏、边框、圆角和复制按钮。
- JSON 的键、字符串、布尔值和数字分别着色。
- 标点符号必须保持足够对比度，不能出现大括号、方括号被背景“吃掉”的情况。
- 长代码允许横向滚动。

### Q33：为什么很多数据格式应该标记为 `json` 而不是 `python`？

如果代码块内容是 API 请求体、响应体、Schema 或工具参数对象的 JSON 表示，应使用：

````markdown
```json
{
  "role": "user",
  "content": "hello"
}
```
````

只有真正可执行的 Python 代码、Python 字典或包含 Python 语法的示例才使用 `python`。正确语言标记会影响代码头部标签和语法高亮。

### Q34：表格、提示框和折叠详情是否支持？

支持：

- Markdown 表格由 `tables` 扩展支持。
- 提示框由 `admonition` 支持。
- 折叠详情由 `pymdownx.details` 支持。
- Tab 由 `pymdownx.tabbed` 支持。
- 属性由 `attr_list` 支持。

---

## 六、图片、视频与 Mermaid

### Q35：Markdown 图片是否支持？

支持标准 Markdown：

```markdown
![图片说明](../../assets/example.png)
```

建议：

- 正式图片放到 `docs/assets/` 或对应专题的局部资源目录。
- 使用相对路径，确保构建后可访问。
- 添加有意义的 alt 文本。
- 不要长期引用微信临时目录等可能被清理的绝对路径。

CSS 会让图片自适应正文宽度，并添加边框和圆角。

### Q36：视频是否支持？

Markdown 本身没有统一的视频语法，可以使用原生 HTML：

```html
<video controls preload="metadata">
  <source src="../../assets/demo.mp4" type="video/mp4">
  当前浏览器不支持视频播放。
</video>
```

当前 CSS 已为 `.md-typeset video` 设置宽度自适应、黑色背景、边框和圆角。

### Q37：Mermaid 如何编写？

使用：

````markdown
```mermaid
flowchart LR
    A[用户请求] --> B[模型调用]
    B --> C[工具执行]
    C --> D[最终回答]
```
````

`mkdocs.yml` 通过 `pymdownx.superfences` 将 `mermaid` fence 输出为 `mermaid-source`，再由 `mermaid-renderer.js` 渲染。

### Q38：Mermaid 当前怎样初始化？

当前配置包括：

- `startOnLoad: false`
- `securityLevel: strict`
- `theme: base`
- `htmlLabels: true`
- `useMaxWidth: false`
- `curve: basis`

脚本兼容 `DOMContentLoaded` 和 MkDocs 即时导航。

### Q39：为什么 Mermaid 图可能显得太大？

常见原因包括：

- 节点文字太长。
- 使用纵向流程导致高度增加。
- Mermaid 自动布局为节点留出较大间距。
- `useMaxWidth: false` 保留自然尺寸。
- 流程本身包含太多节点和回路。

当前 CSS 设置 `max-height: 34rem` 并允许容器横向滚动。优化时优先缩短节点文字、调整 `LR/TB` 方向或拆分复杂流程，不要只靠极小字体强行压缩。

### Q40：Chrome 中 Mermaid 连线标签为什么可能出现白块遮挡？

Mermaid 的 edge label 会生成独立背景元素，浏览器和主题样式叠加后可能出现不协调的浅色背景。当前 CSS 已将 `.edgeLabel`、内部 `span`、`p` 设置为透明，并同步文字颜色。若再次出现，应检查实际生成的 SVG/HTML 结构，不要只猜测 Mermaid 源码有问题。

### Q41：当前 Mermaid 是否完全离线？

不能直接假设完全离线。`mkdocs.yml` 当前引用：

```yaml
https://unpkg.com/mermaid@11/dist/mermaid.min.js
```

虽然启用了 `privacy` 插件，但离线结果仍应通过断网后的实际构建和浏览器加载验证。不要在没有验证的情况下声称完全离线可用。

---

## 七、GitHub 与编辑入口

### Q42：远程仓库是什么？

```text
https://github.com/yiyezhangmu/agentdoc
```

当前工作分支为：

```text
main
```

### Q43：页面编辑链接怎样生成？

`mkdocs.yml` 配置：

```yaml
repo_url: https://github.com/yiyezhangmu/agentdoc
edit_uri: edit/main/docs/
```

同时启用了：

```yaml
content.action.edit
```

因此正式 Markdown 页面可以生成对应 GitHub 编辑链接。

### Q44：编辑按钮为什么会在新窗口打开？

`overrides/partials/actions.html` 为编辑链接增加了：

```html
target="_blank" rel="noopener noreferrer"
```

修改模板时应保留这一行为，除非用户明确要求改变。

### Q45：“本地目录”导航项是怎么实现的？

`mkdocs.yml` 末尾配置了：

```yaml
- 本地目录: file:///D:/dev/docs-jeffrey/docs/
```

这依赖浏览器对 `file://` 链接的安全策略。部分浏览器可能禁止 HTTP 页面直接打开本地文件目录，因此它不是跨环境可靠功能。如需更稳定的方案，应通过本地辅助服务或桌面能力实现，而不是假设所有浏览器都会允许。

---

## 八、AI 与 Agent 内容中的关键事实

### Q46：Chat Completions、Responses API 和 Agents SDK 分别是什么？

- Chat Completions：传统消息式模型调用 API。
- Responses API：OpenAI 新一代统一模型接口，围绕 Item、工具和多模态能力设计。
- Agents SDK：模型接口之上的 Agent Runtime，负责运行循环、工具、Guardrails、Session、Handoff 和 Tracing 等能力。

### Q47：Agents SDK 是否只支持 Responses API？

不是。当前文档结论是：

- 对 OpenAI 模型默认、推荐使用 Responses API。
- 仍可以通过 Chat Completions 模型实现走兼容路径。
- 两条路径能力不完全相同。
- 部分较新的托管工具能力只适用于 Responses 路径。

涉及此类可能变化的官方能力时，AI 应重新核对 OpenAI 官方文档，而不是只依赖本临时文件。

### Q48：`developer` 是否只是旧 `system` 的新名字？

不是简单改名。Chat Completions 仍存在两个角色。对于 `o1` 及更新的 OpenAI 模型，优先使用 `developer` 承载开发者规则；第三方兼容接口可能仍只支持或主要使用 `system`。

### Q49：消息角色必须严格交替吗？

不需要。普通对话常见顺序是：

```text
developer → user → assistant → user
```

工具调用常见顺序是：

```text
developer → user → assistant(tool_calls) → tool → assistant
```

因此最后一条消息不一定必须是 `user`。

### Q50：`stop` 是敏感词禁止参数吗？

不是。它是停止序列，命中后停止生成。使用 `stop=["}"]` 生成 JSON 可能截断闭合大括号，造成无效 JSON。结构化输出应使用 JSON Schema、Structured Outputs 和程序校验。

### Q51：`logit_bias=-100` 是否等于绝对业务禁词？

不能这样理解。它针对 Token ID 调整概率，受 tokenizer、空格、大小写和字符变体影响。安全禁词、权限和合规约束必须由 Guardrails 和业务后端执行。

### Q52：`frequency_penalty` 与 `presence_penalty` 能防止复读吗？

它们只能软性降低重复概率，不能保证不重复。参数过高还可能破坏 JSON 键、代码、专有名词和业务术语。死循环应由 Harness 的最大轮数、重复检测、超时和终止策略处理。

### Q53：`logprobs` 能表示答案正确率吗？

不能。它反映输出 Token 的生成概率，不等于事实正确率、业务可信度或工具结果可信度。正确性需要来源证据、规则校验和 Evals。

### Q54：什么是 Harness 工程？

Harness 是包围模型调用的运行和治理层，通常包括：

- Agent Loop
- 工具调度与参数校验
- 最大轮数、超时、重试和成本控制
- Guardrails 和人工审批
- 会话状态和恢复
- Tracing、日志和指标
- Evals、回归测试和线上质量监控

`seed`、`logit_bias`、`logprobs` 只是模型调用参数，不是 Harness 的核心定义。

### Q55：Prompt、Context、Memory 和 Harness 如何分工？

```text
长期记忆：保存可能以后需要的信息
上下文工程：选择本次调用要给模型的信息
提示词工程：告诉模型怎样使用信息完成任务
Harness：组织全过程并实施工程和安全控制
```

### Q56：长期记忆是否等于 RAG？

不等于。长期记忆还包含结构化提取、更新、删除、过期、冲突处理、用户和租户隔离。RAG 只是非结构化知识的一种检索方式。

### Q57：Agents SDK 能自动解决企业权限和安全问题吗？

不能。认证、租户隔离、数据权限、工具权限、写操作审批、审计、事务、限流和幂等仍必须由业务系统负责。模型不能作为最终安全边界。

---

## 九、Markdown 编写约定

### Q58：新增文档时推荐怎样组织？

对于独立专题，推荐：

```text
docs/<分类>/<专题>/index.md
```

如果有专题私有图片：

```text
docs/<分类>/<专题>/assets/
```

如果资源跨多个页面复用，可放：

```text
docs/assets/
```

### Q59：标题层级怎样使用？

- 页面只有一个 `#` 一级标题。
- 大章节使用 `##`。
- 子章节使用 `###`。
- 更细内容使用 `####`，避免无限加深。
- 当前右侧 TOC 配置深度为 3，因此 `####` 默认不会全部显示在右侧目录。
- 二级标题会被章节折叠脚本增强。

### Q60：代码块应该怎样标记？

必须尽量使用准确语言：

```text
python、json、sql、bash、powershell、yaml、html、javascript、mermaid、text
```

不要为了好看把 JSON 请求体标为 Python，也不要把普通结构图文本误标为 Mermaid。

### Q61：什么时候用 Mermaid，什么时候用代码块？

使用 Mermaid：

- 流程
- 架构关系
- 调用顺序
- 状态转换
- 层次结构

使用普通代码块：

- API 请求与响应
- JSON Schema
- 可执行代码
- 命令
- 单值或固定格式文本

### Q62：外部事实怎样写入文档？

涉及 OpenAI、框架版本、API 参数、模型支持、法律法规和其他会变化的信息时：

1. 优先查官方文档。
2. 写清适用接口、模型或版本。
3. 不把第三方兼容行为说成 OpenAI 官方行为。
4. 不把“通常”“推荐”写成“协议强制”。
5. 为关键结论添加官方链接。

### Q63：怎样避免文档重复？

- API 字段和调用示例放在接口专题。
- 提示词、上下文、记忆、Harness 放在 Agent 工程专题。
- 其他页面通过链接引用，不大段复制。
- FAQ 用于快速给结论，正文负责完整解释。

---

## 十、当前已知边界与风险

### Q64：当前工作区是否干净？

不是。生成本文件前，工作区已有多项未提交变更，包括：

- AI 与 Agent 文档修改。
- OpenAI 专题 Markdown 和丰富版 HTML 修改。
- 自定义 CSS 修改。
- 首页和 `mkdocs.yml` 修改。
- `docs/cloud/index.md` 删除。
- `docs/巡店/`、Agent 工程文档、模板和 `restart.bat` 等新增内容。

AI 必须把这些视为用户正在进行的工作，不得为了“清理状态”而回退。

### Q65：哪些内容属于生成物或临时文件？

- `site/`：MkDocs 构建产物，可重新生成，不提交。
- `.cache/`：缓存。
- `.playwright-cli/`：浏览器自动化临时数据。
- `TEMP_PROJECT_OVERVIEW_QA_FOR_AI.md`：本临时 AI 上下文文件，不属于正式站点。

### Q66：当前有哪些明显未完成项？

- MCP 页面需要补充。
- RAG 页面需要补充。
- “巡店”和“云平台”的命名及内容需要用户确认。
- `readme.md` 几乎为空，未来可以转化为正式仓库说明。
- Mermaid 目前引用外部 unpkg，完全离线能力尚需实际确认。
- `docs/assets/` 与 `overrides/assets/` 的历史重复资源可在确认引用关系后整理。
- 当前丰富版 HTML 是独立页面，与 Markdown 专题可能存在内容同步成本。

### Q67：AI 可以顺便重构所有 CSS 或目录吗？

不可以。应遵循最小修改：

- 样式问题先定位具体选择器和浏览器表现。
- 不因为局部问题整体替换主题。
- 不随意删除 overrides 或重复资源。
- 不擅自重命名中文目录。
- 不改变 GitHub 编辑链接、新窗口行为、侧栏隐藏或章节折叠等已确认需求。

### Q68：AI 可以自动提交和 Push 吗？

只有用户明确要求时才提交或 Push。默认只修改和验证，不创建分支、不提交、不推送。

---

## 十一、AI 接手任务的推荐流程

### Q69：新的 AI 开始工作时应该先看什么？

建议顺序：

1. `git status --short`
2. `mkdocs.yml`
3. 与任务相关的 Markdown 页面
4. `docs/assets/stylesheets/custom.css`
5. 相关 JavaScript
6. `overrides/` 下相关模板
7. 必要时运行本地站点并浏览器检查

### Q70：修改内容文档的流程是什么？

1. 确认应该放在哪个专题，避免重复。
2. 检查标题层级和导航位置。
3. 对时效性事实查询官方来源。
4. 使用准确的代码语言标签。
5. 流程关系优先使用 Mermaid。
6. 增加必要的站内交叉链接。
7. 运行严格构建。

### Q71：修改样式或交互的流程是什么？

1. 在真实页面复现问题。
2. 检查 DOM、CSS 选择器和 JavaScript 绑定。
3. 同时考虑首次加载和 `navigation.instant` 页面切换。
4. 保证脚本幂等，避免重复添加按钮或事件。
5. 检查 `localStorage` 状态恢复。
6. 检查 Chrome、浅色、深色、宽屏和移动端。
7. 运行 `mkdocs build --strict`。

### Q72：怎样处理用户给的截图或 Chrome 问题？

不要只根据描述猜测。应该：

1. 打开用户正在看的真实 URL。
2. 确认浏览器缩放、主题和侧栏状态。
3. 检查元素实际 DOM 和计算样式。
4. 区分 Markdown 源码、Pygments 高亮、Mermaid SVG 和自定义 CSS 问题。
5. 修改后重新加载相同页面和锚点验证。

### Q73：什么情况下需要新增正式专题？

当内容满足以下条件时适合新建专题：

- 有独立的问题域和持续扩展空间。
- 内容超过当前页面的一小节。
- 与现有专题职责明显不同。
- 需要独立导航入口。

例如“提示词、上下文、记忆和 Harness”跨越多个 API，适合独立为 Agent 工程专题，而不是继续塞进 OpenAI 接口专题。

### Q74：什么情况下只需要加 FAQ？

当问题是已有正文的常见误解、快速结论或边界提醒时，优先加到现有专题 FAQ，并链接详细章节，不要创建只有几行内容的新页面。

---

## 十二、可直接提供给其他 AI 的项目介绍

### Q75：如果只能用一段话介绍项目，应该怎么说？

这是一个基于 MkDocs Material 的本地个人 Markdown 知识库，仓库位于 `D:\dev\docs-jeffrey`，通过 `mkdocs serve -a 127.0.0.1:3164` 启动。项目重点是宽屏技术文档阅读体验，支持浅色/深色主题、左右导航独立隐藏、二级章节折叠、图片、HTML 视频、Mermaid、GitHub 风格代码高亮、复制按钮、搜索和 GitHub 新窗口编辑链接。当前 AI 与 Agent 内容最完善，包含 OpenAI Chat Completions、Responses API、Agents SDK 以及提示词、上下文、长期记忆和 Harness 工程专题。新增文档不会自动写入 `mkdocs.yml` 导航；修改后应运行 `git diff --check` 和 `mkdocs build --strict`，样式交互还需在真实浏览器中验证。当前工作区存在未提交变更，不得擅自回退。

### Q76：可以给其他 AI 什么开场提示？

```text
请先阅读 TEMP_PROJECT_OVERVIEW_QA_FOR_AI.md、mkdocs.yml、git status 和本次任务相关文件。
这是一个 MkDocs Material 本地 Markdown 知识库，不是业务后端。
请保留当前未提交修改，遵循最小修改，不要擅自重构主题或目录。
涉及 OpenAI 当前能力时只使用官方文档核对。
修改完成后运行 git diff --check 和 mkdocs build --strict；涉及 UI 时打开 127.0.0.1:3164 做真实浏览器验证。
```

### Q77：这份临时文档不能替代什么？

它不能替代：

- 当前工作区的真实代码和配置。
- `git diff` 中正在进行的修改。
- OpenAI 等外部产品的最新官方文档。
- 用户对命名、范围和视觉效果的最新要求。
- 浏览器中的真实运行结果。

如果本文件与代码冲突，以当前代码为准；如果与用户当前明确要求冲突，以用户要求为准。

---

## 十三、快速命令清单

### 查看状态

```powershell
cd D:\dev\docs-jeffrey
git status --short
git diff --check
```

### 启动站点

```powershell
mkdocs serve -a 127.0.0.1:3164
```

### 严格构建

```powershell
mkdocs build --strict
```

### 查找 Markdown 文档

```powershell
rg --files docs -g "*.md"
```

### 查找标题

```powershell
rg -n "^#{1,4} " docs -g "*.md"
```

### 查找站点功能实现

```powershell
rg -n "sidebar-hidden|toc-hidden|section-collapse|mermaid|highlight" docs overrides mkdocs.yml
```

---

## 十四、最后的维护原则

1. **代码和配置优先**：说明文档与当前实现冲突时，以当前实现为准。
2. **用户需求优先**：不要为了架构整洁牺牲用户已确认的阅读体验。
3. **最小修改优先**：修具体问题，不做无关重构。
4. **准确性优先**：动态 API 事实必须重新查官方资料。
5. **浏览器验证优先**：UI 问题必须尽量在真实页面验证。
6. **内容分层优先**：接口、工程方法、知识检索和业务专题各归其位。
7. **安全边界清晰**：模型和 Prompt 不能代替业务权限与后端控制。
8. **保持可删除性**：本文件是临时 AI 上下文，不要把它加入正式导航，除非用户后续明确要求。
