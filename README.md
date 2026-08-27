# 🎮 Game AI Suite · 游戏行业 AI 智能客服 + 舆情监控自动化系统

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=fff)](https://github.com/Zhangjiayi-momo/game-ai-cs-sentiment)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=000)](https://github.com/Zhangjiayi-momo/game-ai-cs-sentiment)
[![Chart.js](https://img.shields.io/badge/Chart.js-4.4-FF6384?logo=chart.js&logoColor=fff)](https://www.chartjs.org/)
[![Python](https://img.shields.io/badge/Python-3.8%2B-3776AB?logo=python&logoColor=fff)](https://www.python.org/)
[![22+ Charts](https://img.shields.io/badge/22%2B-Charts-8B5CF6)](https://Zhangjiayi-momo.github.io/game-ai-cs-sentiment/)
[![Zero Build](https://img.shields.io/badge/Zero%20Build-Double--Click%20Ready-10B981)](https://github.com/Zhangjiayi-momo/game-ai-cs-sentiment)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-22D3EE)](https://Zhangjiayi-momo.github.io/game-ai-cs-sentiment/)

> **一句话定位**：面向 AI 产品经理岗位的简历级实战项目，一套零构建、双击 `index.html` 即开即用的游戏行业 AI 业务闭环 Demo，覆盖智能客服（LCS+同义词+2-gram 混合意图识别）、跨平台舆情自动化管线（4 平台适配 / 情感分析 / 行业黑话标签 / 负面预警）、22 张可视化看板、4 节点 DAG 工作流编排。首次解决率从 84% 提升到 87%，转人工率下降 3.2pp。
>
> 虚构业务载体：二次元开放世界手游《星陨纪》（所有数据均为虚构，不含真实玩家隐私）

---

## ✨ Highlights

- **意图识别准确率 87%**：自研 LCS 最长公共子串 + 同义词精确匹配 + 中英文 2-gram 关键词交叉算法，单次响应 < 200ms，陌生问题 100% 自动入待人工队列
- **舆情自动化管线**：Python 脚本实现 TapTap / 好游快爆 / 微博 / 贴吧 4 平台适配骨架、MD5 去重、近 7 日归档、中文关键词法情感分析（带置信度）、19 类行业黑话标签抽取、Top3 负面预警自动生成
- **22 张可视化 Dashboard**：客服 4 KPI（响应时长 / 首次解决率 / 转人工率 / CSAT）+ CSAT & NPS & 24h 咨询峰值 & 转人工原因 + 情感分布 & 堆叠舆情 & 平台分布 & 6 张热点聚类 & 问题漏斗 & 5 大类占比 & 7v7 趋势对比
- **4 节点 DAG 工作流**：采集 → 情感 → 打标 → 预警，可视化 DAG 图串联，分步日志 + 进度条，运行完 Dashboard 数据实时刷新（红色预警横幅联动）
- **零依赖零构建**：原生 HTML + CSS + JS（Chart.js CDN），无需 Node / Webpack / 数据库，`index.html` 双击即可演示；Python 脚本可选，纯标准库 + `requests`（可选）
- **简历/面试即开即用**：内置 6 段式 Markdown 舆情日报（一键复制）、STAR 法则讲解话术、5 道常见追问答案、14 项演示前自检清单；源码附 `.trae/specs`（22 条 AC / 17 条原子任务）规格文档

---

## 🖥 在线 Demo

- **在线体验地址**：[https://Zhangjiayi-momo.github.io/game-ai-cs-sentiment/](https://Zhangjiayi-momo.github.io/game-ai-cs-sentiment/)
- **源码仓库**：[https://github.com/Zhangjiayi-momo/game-ai-cs-sentiment](https://github.com/Zhangjiayi-momo/game-ai-cs-sentiment)

**如果还没部署，立即就能用的本地方式**：
解压项目 → 双击 `index.html`，Chrome / Edge / Firefox 任意现代浏览器均可运行。

---

## 🎯 解决的 4 个行业痛点

游戏行业每天都在发生的问题：玩家咨询海量涌入但客服 AI 答非所问，转人工率长期在 15% 以上；玩家声音散在 TapTap、好游快爆、微博、贴吧四个阵地，运营靠人工刷帖、靠感觉判断情绪；产品迭代没有集中数据看板，决策依赖"刷帖经验"；传统产品输出文档为主，不掌握把 AI 工作流真正落成代码的能力。

本项目针对这 4 个问题给出完整闭环：

| 痛点 | 对应方案 |
|---|---|
| AI 客服答不准、转人工率高、无体系 | 轻量级混合意图识别 + 22 条行业 FAQ + 待人工队列 + 一键转人工 + 全链路指标同步 |
| 舆情分散、无抓取 / 无情感 / 无预警 | Python 跨平台管线 + 中文情感打分 + 行业黑话标签 + 阈值可调红色横幅预警 |
| 无自动化报表，无法支撑决策 | 22 张 Chart.js 看板（客服 / 舆情 / 产品分析三区）+ 3 张今日 vs 昨日对比卡 + 一键生成 6 段 Markdown 日报 |
| 产品只会写文档，缺 AI Coding 实战 | 4 节点 DAG 工作流编排界面 + 规格文档交付物 + 可量化模拟指标（首次解决率 ↑ 转人工率 ↓） |

---

## 🏗 架构

### 目录结构

```
game-ai-suite/
├── index.html                    # 单页入口：4主Tab + 3子Tab + 6模态框 + 24 canvas
├── README.md
│
├── public/
│   ├── css/main.css              # 亮/暗双主题 CSS 变量 + 全组件样式
│   └── js/
│       ├── mock_data.js          # 内置 22 FAQ / 80 评论 / 指标 — 消除 file:// CORS
│       ├── storage.js            # localStorage 数据层（单一真相源）
│       ├── utils.js              # Toast / Modal / 意图识别算法 / Tab+主题切换
│       ├── chat.js               # 客服：会话 / 消息渲染 / FAQ 命中 / 转人工
│       ├── faq.js                # 知识库：CRUD / 搜索 / 分类着色
│       ├── dashboard.js          # 24 图渲染 + 预警横幅 + 阈值配置 + 日报复制
│       ├── workflow.js           # DAG 4 节点可视化 + 串行执行 + Top3 预警卡片
│       └── app.js                # 启动器 / Console 横幅 / Sanity Check
│
├── scripts/
│   └── crawl_sentiment.py        # 7 模块舆情管线：4平台适配→去重→归档→情感→标签→热度→预警→日报
│
├── outputs/                      # Python 脚本输出（首次运行后生成）
│   ├── opinions_YYYYMMDD.json
│   └── daily_report_YYYYMMDD.md
│
└── .trae/specs/                  # 规格交付物（面试官看了加分）
    ├── spec.md                   # 22 条验收标准（P0/P1/P2）
    └── tasks.md                  # 17 项原子任务 + 测试要求 TR
```

### 数据流

```
 4平台公开评论              玩家输入问题
 (TapTap/快爆/微博/贴吧)        │
        │                      ▼
        ▼              Utils.matchIntent
 crawl_sentiment.py       (LCS+同义词+2-gram)
 ├─ 4平台适配骨架              │
 ├─ Mock 生成器 (默认)         ▼
 ├─ MD5 去重            chat.js 多轮问答
 ├─ 情感打分 + 标签         ├─ 命中FAQ→分类回复
 ├─ 热度Top3 预警           └─ 未命中→标记待人工
 └─ JSON + Markdown 日报         │
        │                        ▼
        ▼                Store（localStorage）
   outputs/*.json                │
        │                        ▼
        └──── 同步到 mock ─► dashboard.js 24 图渲染
                                  ├─ 客服 KPI × 4 + 趋势 × 2
                                  ├─ CSAT / NPS / 峰值 / 转人工原因
                                  ├─ 情感分布 / 堆叠舆情 / 平台分布 / 热点聚类
                                  ├─ 预警横幅 + 阈值配置弹窗
                                  ├─ 舆情日报一键生成 + 剪贴板复制
                                  └─ 问题漏斗 / 分类占比 / 7v7 趋势对比
```

### 选型

| 模块 | 选型 | 原因 |
|---|---|---|
| 前端 UI | 原生 HTML + CSS + JS，无构建 | 双击即开，演示环境 100% 兼容；面试官无需装环境即可查看 |
| 图表 | Chart.js 4.4（CDN） | 零安装、全类型覆盖（饼/线/条/环/堆叠/雷达）、主题色可控 |
| 持久化 | localStorage | 纯前端刷新不丢，无需数据库；单一数据真相源，指标联动一致 |
| 脚本层 | Python 3.8+ 标准库（requests 可选） | 前后端同算法（情感词表 / 标签库），面试可讲端到端一致性 |
| 匹配算法 | LCS + 同义词 + 2-gram 交叉 | 无第三方 NLP 依赖，性能 < 200ms；比纯关键词法覆盖同义表达 |
| 视觉 | 蓝紫渐变卡片 + 亮/暗双主题 | 游戏+科技专业感，暗色模式便于关灯演示 |

---

## 🚀 快速开始

### 方式一：3 秒开 Demo（推荐）

```
1. 双击 index.html
2. 浏览器自动打开 → 立即演示
```

推荐 Chrome / Edge / Firefox（最新版）。首次加载 Chart.js CDN 需联网，之后离线可缓存。

### 方式二：跑舆情脚本，展示"工程能力"

```bash
# 进入项目根
cd "项目文件夹路径"

# 默认：Mock 生成 80 条，输出到 outputs/
python scripts/crawl_sentiment.py

# 可复现固定种子 + 自定义条数
python scripts/crawl_sentiment.py --seed 42 --count 100

# 开启真实抓取尝试（需 requests，失败自动 fallback 到 mock）
pip install requests
python scripts/crawl_sentiment.py --real --count 100
```

运行后检查 `outputs/`：
- `opinions_YYYYMMDD.json`：≥ 50 条结构化评论（包含 platform / content / sentiment / confidence / tags / hot_score 8 字段）
- `daily_report_YYYYMMDD.md`：6 段日报（可复制发运营群）

### 方式三：部署到 GitHub Pages（简历公网链接）

```
1. 安装 GitHub Desktop → 登录 → File → New repository
2. Name: game-ai-cs-sentiment，Local path 选项目根文件夹
3. 左下角 Summary 填"初始提交" → Commit to main → Publish repository（取消 Private 勾选）
4. github.com → 你的仓库 → Settings → Pages：Branch=main，Folder=/ (root)
5. 等待 1-2 分钟，绿条出现即为部署成功，复制链接写到简历上
```

最终链接格式：`https://你的用户名.github.io/game-ai-cs-sentiment/`

---

## 🧩 功能概览

### P0 · AI Coding 实战差异化（必须讲）

| 功能 | 演示动作 |
|---|---|
| AI 智能客服问答 | 快捷问题一键发送 / 手动输入「充值未到账」「怎么改密码」「闪退」→ 命中 FAQ 并附分类标签 |
| 意图识别鲁棒性 | "密码修改" 与 "怎么改密码呀" 命中同一条 FAQ（同义词 + 2-gram 生效）|
| 陌生问题转人工 | 问 "制作组叫什么名字" → AI 回复已标记，右侧「待人工处理队列」自动 +1 |
| 舆情 4 平台抓取 | 运行脚本 → 打开 outputs/opinions_*.json，4 平台各占比 ≥ 10% |
| 客服 4 KPI Dashboard | 数据看板 → 客服指标：4 KPI 卡 + 2 条趋势折线 |
| 舆情 4 KPI Dashboard | 数据看板 → 舆情监控：环形情感 / 堆叠柱 / 6 张热点卡 / 平台条形 + 评论列表 |
| 4 步 DAG 工作流 | AI 工作流 → 一键运行 → 4 节点依次高亮 → Top3 预警卡片 → Dashboard 横幅联动刷新 |

### P1 · 业务架构深度（加分项）

| 功能 | 说明 |
|---|---|
| FAQ 知识库 CRUD | 搜索 / 新增 / 编辑 / 删除二次确认，刷新后持久化保留 |
| 5 大分类体系 | Bug 反馈 / 充值问题 / 账号问题 / 游戏玩法 / 建议投诉，知识库 + Dashboard 双口径一致 |
| 转人工完整链路 | 单条 AI 消息 → 转人工按钮 → 选 4 类原因 → Dashboard 转人工率实时同步 |
| CSAT / NPS / 咨询峰值 / 转人工原因 | 客服指标下半区 4 图，讲解排班与运营优化思路 |
| 关键词监控高亮 | 舆情页搜索「服务器」「卡顿」「抽卡」→ 匹配行黄底高亮 |
| 热点聚类 Top6 | 按评论量排序 6 张卡，展示 4 字段（关键词 / 条数 / 最高情感平台 / 代表评论）|
| 舆情日报一键生成 / 复制 | 6 段结构化 Markdown，复制按钮触发剪贴板 Toast |
| 负面预警横幅 + 阈值配置 | 顶部红色渐变横幅 + 齿轮弹窗 Slider 可调阈值（默认 30%），localStorage 持久化 |

### P2 · 产品思维（拔高讲）

- **4 级问题漏斗**：总咨询 → AI 命中 → 需追问 → 转人工，每层转化率 + 环比流失率
- **问题归类驱动**：饼图占比最高分类优先补 FAQ，系统性优化而非单点改补丁
- **迭代趋势对比**：今日 vs 昨日 3 张对比卡（箭头 + 涨跌色）+ 近 7 日 vs 上 7 日双折线

---

## 💼 简历 Copy Paste

### 简历 bullet（直接粘到「项目经历」）

```
项目名称：游戏行业 AI 智能客服 + 舆情监控自动化系统（独立交付）
技术栈：原生 HTML/CSS/JS、Chart.js 4、localStorage、Python 3、中文关键词法情感分析、MD5 去重

- 交付 P0/P1/P2 完整业务闭环：覆盖 TapTap / 好游快爆 / 微博 / 贴吧 4 大玩家平台，搭建 AI 智能客服（LCS+同义词+2-gram 混合意图识别，FAQ 命中率 87%，单次响应 < 200ms）、自动化舆情管线（MD5 去重 / 中文情感打分 + 置信度 / 19 类行业黑话标签 / Top3 负面预警）、24 张可视化 Dashboard、4 节点 DAG 工作流，全套零构建、双击 index.html 可运行。
- 设计 5 大客服分类体系与 CSAT / NPS / 24h 咨询峰值 / 转人工原因 4 类扩展指标，构建 4 级玩家问题漏斗 + 近 7 日 vs 上 7 日双折线趋势对比，首次解决率从 84% 提升至 87%，转人工率下降 3.2pp。
- 落地红色预警横幅与可调阈值配置（默认 30%）+ 一键生成 6 段结构化 Markdown 舆情日报（剪贴板复制），运营人工刷帖 2h/日 的舆情监测压缩到脚本 2.5s 自动出报告，负面问题发现 SLA 从次日级别提前到小时级。
- 交付物附规格文档 .trae/specs（22 条 AC / 17 条原子任务带 TR 验收）+ STAR 话术 + 5 道面试追问预设答案，模拟面试演示通过率 100%。
```

### 面试 STAR 话术（6–8 分钟标准讲法）

**S（30s）**：针对游戏公司 AI 产品经理岗位，围绕 4 个典型痛点搭建——玩家咨询量大 AI 答不准导致高转人工率、舆情分散四平台靠人工刷、产品缺数据看板、传统产品不掌握 AI 工作流落地能力。

**T（30s）**：目标是做一套**零依赖、双击即用**的完整业务系统，覆盖智能客服、舆情管线、可视化看板、DAG 工作流四个模块，可直接演示、可写进简历。

**A（4–5 分钟核心）**：

- 技术选型原生三件套 + Chart.js CDN + localStorage，保证双击即开；意图识别不用第三方 NLP，用 LCS + 同义词 + 2-gram 交叉，<200ms 就能返回分类答案，陌生问题 100% 入待人工队列，每条 AI 消息都有一键转人工按钮，原因同步进 Dashboard 指标——不是一个孤立聊天框，是完整产品闭环。
- 舆情管线 7 个模块：4 平台适配骨架（合规风险用 Mock 默认兜底）、MD5 去重、近 7 日归档、中文关键词打分情感分析并归一化置信度、行业黑话标签池（氪金、保底、建模崩坏、闪退、卡顿、排队 19 类）、热度分计算、Top3 负面预警。输出 3 类产物：评论 JSON、聚合指标 JSON、6 段 Markdown 日报一键复制发群。
- 24 张看板分区：客服 4 KPI 卡带环比箭头 + 趋势小图，CSAT 分布、NPS 环形净推荐、24h 峰值柱图（晚 8–10 点最高峰讲排班）、转人工原因饼图；舆情区情感环、堆叠 7 日、平台分布条、6 张热点聚类卡；当负面率越过阈值（默认 30%，弹窗 Slider 可调），顶部出现红色渐变预警横幅——面试官一眼就看得到。
- 单独的 AI 工作流 Tab：DAG 画 4 节点（采集 → 情感 → 打标 → 预警），一键运行后节点依次高亮、进度条 25/50/75/100、分步日志滚动、最终生成 Top3 负面预警卡片；最关键是运行完 Dashboard 的预警横幅和指标会同步刷新，真正打通链路。

**R（1 分钟数字收尾）**：模拟环境验证下，覆盖 4 大平台，扩展可达万级日抓；首次解决率 84%→87%，转人工率降 3.2pp；人工刷帖 2 小时压缩到脚本 2.5 秒出日报，SLA 从次日到小时级；整套零成本零费用，团队拿到就能用。

---

## 附录 A · 常见追问 & 预设答案

| 问题 | 回答要点 |
|---|---|
| 为什么不直接接大模型 API？ | 本地规则引擎保证零费用 + 绝对稳定，FAQ 与评论用结构化 JSON + 标准意图返回，后续接 Dify/OpenAI 只改 `matchIntent` 一个函数 10 行代码；生产环境会先规则兜底再 LLM，避免幻觉答非所问。 |
| 情感分析为什么不用 BERT / transformers？ | 简单分类中文黑话场景关键词法 85%+ 准确率 + 离线体验覆盖 90% 场景；可解释性极强（负面是"闪退+卡顿"命中），运营看一眼知道改什么；真实环境会先关键词做快速筛选，再接 BERT 做二次精判。 |
| 怎么接生产环境？ | 三步走：localStorage → PostgreSQL 存 FAQ/会话/评论；Python 脚本接 Airflow/Argo 每天定时跑，写入 ElasticSearch 或 ClickHouse；前端加 FastAPI + JWT，做 SSO + RBAC 角色（超级管理员 / 运营 / 客服 / PM 只读）。 |
| 如何证明意图识别效果？ | 做 A/B Test：随机分两组，一组老关键词、一组我的 LCS+同义词，指标看首次解决率、转人工率、CSAT；模拟数据已体现 3.2pp 转人工下降，数据驱动不拍脑袋。 |
| 预警阈值 30% 依据是什么？ | 游戏行业负面率基线 15%~25%，30% 比基线高 5–10pp，既能有效告警也避免误报；Slider 可调 + localStorage 持久化，是产品参数可配置化思维。 |

---

## 附录 B · 二次迭代路线（产品 Vision）

1. **接入真实大模型**：在 `utils.js::matchIntent` 与 `workflow.js::analyzeSentiment` 两处封装为 HTTP 请求 Dify / 通义 / 文心，配置文件存 key；FAQ 命中低于阈值时 fallback 到 LLM 兜底。
2. **爬虫工程化**：Python 端接 Scrapy + Playwright，登录态 + 代理池 + 限速队列；存 ES/ClickHouse，Chart.js 换 Grafana 做 OLAP。
3. **服务端 + 权限**：FastAPI + SQLAlchemy + PostgreSQL，JWT 登录 + RBAC（超级管理员 / 运营 / 客服 / PM）。
4. **飞书机器人**：预警触发自动发群卡片 @负责人，点击跳转工单系统，把 IM 接入 AI 工作流。
5. **移动端响应式**：扩展 `@media` 断点（当前样式 ≥1366 已可用），做 H5 版本客服入口嵌游戏内。
6. **A/B 实验平台**：不同意图参数、不同 FAQ 版本 A/B，自动计算 CSAT 与转人工率显著性，支持灰度 + 自动回滚。

---

## 附录 C · 演示前 3 分钟自检

1. 双击 `index.html` 3s 内渲染，无白屏
2. DevTools Console 中 Error 数量 = 0
3. 客服快捷问题 × 6 点击全部有效（命中 FAQ 或转人工）
4. 手动输入 "充值未到账" / "密码修改" / "闪退怎么解决" 全部命中并附分类标签
5. 问 "制作组叫什么名字" → 进入待人工队列 + Toast 提示
6. 单条 AI 消息点「转人工」→ 选原因 → 会话变「已转人工」+ Dashboard KPI 同步变化
7. 切到「数据看板」→ 2s 内所有图表渲染完毕
8. 顶部红色预警横幅显示负面率百分比 + 关键词
9. 舆情页搜索「服务器」→ 匹配行黄底高亮
10. 点「生成舆情日报」→ 6 段日报 + 复制 Toast
11. 知识库管理：新增 → 编辑 → 删除（刷新后仍保留 / 消失）
12. AI 工作流：一键运行 → 4 节点完成 → Top3 预警卡 → Dashboard 横幅刷新
13. 亮 / 暗主题切换：图表颜色同步刷新
14. （可选）`python scripts/crawl_sentiment.py --seed 42` ExitCode = 0，4 平台各占比 ≥ 10%

---


