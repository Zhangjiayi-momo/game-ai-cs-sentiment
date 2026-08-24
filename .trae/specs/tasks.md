# 游戏行业 AI智能客服+舆情监控自动化系统 - 实现任务清单 (tasks.md)

## Task 1: 项目骨架与Mock数据层搭建
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - 创建 `index.html` 入口空壳（含Chart.js CDN引入）。
  - 构建 `mock/` 下核心Mock数据JSON：FAQ知识库、客服指标、评论数据（4平台/情感/标签）、热点聚类、漏斗/分类数据。
  - 构建 `public/js/storage.js` 封装localStorage读写+mock初始化函数。
- **Acceptance Criteria Addressed**: AC-19, AC-20, AC-21
- **Test Requirements**:
  - `rule` TR-1.1: 浏览器打开index.html不出现404资源错误；Console无异常。Evidence: DevTools Network+Console截图。
  - `rule` TR-1.2: mock/faq.json条目数>=20条，至少覆盖5大分类（账号/充值/玩法/Bug/建议）。Evidence: 文件存在+统计命令输出。
  - `rule` TR-1.3: mock/comments.json记录数>=80，platform字段覆盖TapTap/好游快爆/微博/贴吧4类，sentiment字段为positive/neutral/negative。Evidence: head命令或JSON抽样。
  - `rubric` TR-1.4: 业务真实性；scale 1-5；anchors 1=占位/3=泛泛/5=行业黑话；threshold>=4。Evidence: 抽样FAQ和评论内容检查。
- **Notes**: Mock数据用虚构游戏名"星陨纪"（二次元开放世界手游）以增强场景感。

## Task 2: 前端HTML多Tab主框架与导航
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 1
- **Description**:
  - 在 `index.html` 实现4个主Tab导航：「智能客服」「数据看板」「知识库管理」「AI工作流」。
  - 「数据看板」下再设3子Tab：「客服指标」「舆情监控」「产品分析」。
  - 顶部品牌栏：项目Logo（文字+图标SVG）+暗色模式切换按钮。
  - 统一容器布局：侧边栏或顶栏导航 + 主内容区。
- **Acceptance Criteria Addressed**: AC-1, AC-6, AC-7, AC-19
- **Test Requirements**:
  - `rule` TR-2.1: 4主Tab可切换显示不同内容，默认显示「智能客服」。Evidence: 切换录屏或截图序列。
  - `rule` TR-2.2: 数据看板3子Tab可切换，默认显示「客服指标」。Evidence: 截图。
  - `rubric` TR-2.3: UI/UX质量；scale 1-5；anchors 1=无样式杂乱/3=基础卡片/5=科技蓝紫渐变+精致卡片阴影+响应式1366+；threshold>=4。Evidence: 首屏全景截图。

## Task 3: 全局CSS样式体系（产品后台风格）
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 2
- **Description**:
  - 编写 `public/css/main.css`：CSS变量定义主色/辅色/背景/文本；暗色模式变量。
  - 卡片、按钮、表格、输入框、气泡、进度条、预警横幅、预警卡片统一组件样式。
  - 响应式断点（1366/1440）。
- **Acceptance Criteria Addressed**: NFR-5, AC-20
- **Test Requirements**:
  - `rule` TR-3.1: 暗色模式切换按钮可改变背景和文本色，刷新后保留状态（localStorage）。Evidence: 切换前后两张截图。
  - `rule` TR-3.2: 所有按钮/输入框有hover效果，卡片有阴影和圆角。Evidence: 元素检查截图。
  - `rubric` TR-3.3: 样式一致性；scale 1-5；anchors 1=混乱/3=基本统一/5=视觉精致且暗色模式下同样协调；threshold>=4。Evidence: 明/暗两张全景图。

## Task 4: AI智能客服对话模块（P0核心）
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 1, Task 2, Task 3
- **Description**:
  - 实现 `public/js/chat.js`：消息渲染、发送、意图识别（关键词+同义词匹配算法）、FAQ命中、未命中标记。
  - 对话UI：左侧历史会话列表，中间消息气泡（人右AI左+头像），底部输入框（支持Enter发送）+发送按钮。
  - 每条AI回复附分类标签（如「账号问题」）；未命中时AI回复标记待人工文案并写入待人工列表。
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3
- **Test Requirements**:
  - `rule` TR-4.1: 输入"充值未到账怎么办""怎么改密码""进不去游戏闪退"可命中对应FAQ并返回答案。Evidence: 对话截图3张。
  - `rule` TR-4.2: 对同一FAQ，输入至少2种同义表述（如"密码修改"/"怎么改密码"）均命中同一答案。Evidence: 匹配逻辑控制台日志或命中结果截图。
  - `rule` TR-4.3: 输入陌生问题（如"你们制作组叫什么名字"），AI给出待人工回复，且待人工列表localStorage中新增记录。Evidence: AI回复+待人工面板条目截图。
  - `rule` TR-4.4: Enter键发送消息可用。Evidence: 操作演示。

## Task 5: FAQ知识库管理后台（P1-1）
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 1, Task 4
- **Description**:
  - 「知识库管理」Tab：表格列表展示所有FAQ（问题/答案/分类/操作）。
  - 新增/编辑弹窗：问题、答案、分类下拉（账号/充值/玩法/Bug/建议/其他）。
  - 删除二次确认。
  - 搜索框按问题关键词过滤。
- **Acceptance Criteria Addressed**: AC-9
- **Test Requirements**:
  - `rule` TR-5.1: 新增FAQ后，立即出现在列表；刷新浏览器后仍存在。Evidence: 新增前后对比+F5刷新截图。
  - `rule` TR-5.2: 编辑FAQ答案文本并保存，答案更新；在客服Tab输入该问题可返回新答案。Evidence: 编辑后对话命中截图。
  - `rule` TR-5.3: 删除FAQ后列表条目消失，且客服Tab不再命中该FAQ。Evidence: 删除后命中测试。

## Task 6: 转人工标记与会话状态链路（P1-2/3）
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 4
- **Description**:
  - 每条AI消息旁增加「转人工」按钮；人工标记弹窗：选择原因（无法解答/态度不满/问题复杂/其他）+备注。
  - 会话列表添加状态：已解决/进行中/已转人工。
  - 转人工数据同步到客服指标的转人工率分母分子。
- **Acceptance Criteria Addressed**: AC-10
- **Test Requirements**:
  - `rule` TR-6.1: 点转人工选原因确认后，会话状态变「已转人工」，列表标识变色。Evidence: 会话状态截图。
  - `rule` TR-6.2: 执行1次转人工后，Dashboard转人工率指标数值相对上升（或分子+1）。Evidence: 转人工前后Dashboard指标对比截图。

## Task 7: P0客服4指标Dashboard
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 1, Task 2, Task 3
- **Description**:
  - 「数据看板-客服指标」顶部4张KPI卡片：平均响应时长、首次解决率、转人工率、CSAT满意度，各带图标、数值、环比差值箭头。
  - 2张折线图：近7日响应时长趋势、近7日首次解决率趋势。
- **Acceptance Criteria Addressed**: AC-6
- **Test Requirements**:
  - `rule` TR-7.1: 4张卡片数值非空且有单位（如秒、%），卡片样式统一。Evidence: 截图。
  - `rule` TR-7.2: 两张Chart.js折线图渲染成功，X轴为7天日期，Y轴刻度合理。Evidence: DevTools无Chart.js报错截图+图表截图。

## Task 8: P1客服扩展指标（CSAT/NPS/漏斗/峰值）
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 7
- **Description**:
  - CSAT分布条形图（1-5星各数量）。
  - NPS环形图（Detractor/Passive/Promoter 3段占比）。
  - 咨询峰值24h柱状图（0-23点各小时咨询量）。
  - 转人工原因饼图。
- **Acceptance Criteria Addressed**: AC-11
- **Test Requirements**:
  - `rule` TR-8.1: CSAT/NPS/峰值/转人工原因4种图表全部成功渲染。Evidence: 4图拼合截图。
  - `rubric` TR-8.2: 指标完整度与可视化质量；scale 1-5；threshold>=4；anchors见AC-11。Evidence: 客服扩展指标区域全景截图。

## Task 9: P0舆情4指标Dashboard
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 1, Task 2, Task 3
- **Description**:
  - 「数据看板-舆情监控」区域：
    - 好评率/差评率环形饼图（+中间综合情感指数）。
    - 每日舆情增量柱状图（近7日每日评论量堆叠为3段情感）。
    - 热点事件聚类Top5卡片（关键词、评论数、情感倾向、摘要）。
    - 平台分布条形图。
- **Acceptance Criteria Addressed**: AC-7, AC-13
- **Test Requirements**:
  - `rule` TR-9.1: 饼图/柱状图/平台条形图全部渲染。Evidence: 截图。
  - `rule` TR-9.2: 热点事件卡片>=5张，每张含4字段（关键词/评论数/情感/摘要）。Evidence: 卡片面板截图。

## Task 10: 情感分析与关键词标签（P1-6/5）
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 9
- **Description**:
  - 评论列表区（舆情监控下方面板）：每条评论展示平台来源图标、作者、内容、情感标签色块（绿正/灰中/红负）+置信度、关键词标签Chips、热度分。
  - 关键词监控输入框：输入词命中时内容高亮（黄色背景）。
  - 支持按情感/平台筛选。
- **Acceptance Criteria Addressed**: AC-12
- **Test Requirements**:
  - `rule` TR-10.1: 评论列表>=20条，每条sentiment字段着色正确，tags Chips >=2个。Evidence: 列表抽样截图。
  - `rule` TR-10.2: 关键词搜索输入"卡顿"后，包含该词的评论行背景高亮。Evidence: 高亮截图。
  - `rule` TR-10.3: 情感/平台筛选下拉选择后列表正确过滤。Evidence: 前后对比截图。

## Task 11: 舆情日报自动生成（P1-8）
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 9
- **Description**:
  - Dashboard舆情区右上「生成舆情日报」按钮。
  - 弹窗：结构化日报文本（Markdown或纯文本格式）含日期、总评论数、平台分布、情感分布、Top3热点、负面预警清单。
  - 「复制到剪贴板」按钮+成功Toast提示。
- **Acceptance Criteria Addressed**: AC-14
- **Test Requirements**:
  - `rule` TR-11.1: 按钮点击后弹窗展示日报，字符数>=300，含上述6结构段。Evidence: 弹窗全文截图。
  - `rule` TR-11.2: 复制按钮点击后粘贴到记事本内容与弹窗一致，Toast"已复制"提示可见。Evidence: 记事本粘贴截图+Toast截图。

## Task 12: 负面预警横幅与阈值（P1-9）
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 9
- **Description**:
  - Dashboard顶部红色横幅：含⚠️图标、动态文案（今日负面占比X%，主要集中在【关键词】）、关闭按钮、设置按钮（调阈值弹窗：slider+保存）。
  - 可选声音提示开关（Audio元素播放简短提示音）。
- **Acceptance Criteria Addressed**: AC-15
- **Test Requirements**:
  - `rule` TR-12.1: Mock数据负面>=30%时，横幅显示；文案数值与实际计算一致。Evidence: 横幅截图+负面率公式检查结果。
  - `rule` TR-12.2: 设置阈值Slider改到50%后保存，刷新页面阈值仍保留；当负面<50%时横幅消失。Evidence: 设置截图+阈值持久化验证。

## Task 13: P2产品分析（漏斗/分类/趋势对比）
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 7, Task 9
- **Description**:
  - 「数据看板-产品分析」子Tab：
    - 4级阶梯漏斗图：总咨询量→AI匹配→需追问→转人工（带各层数量和转化率%）。
    - 问题分类饼图+条形图（5大类）。
    - 趋势对比区：近7日vs上7日（双折线图）、今日vs昨日卡片组（3指标差值箭头+涨跌色）。
- **Acceptance Criteria Addressed**: AC-16, AC-17, AC-18
- **Test Requirements**:
  - `rule` TR-13.1: 漏斗图4层数值合理递减，数值与百分比均可见。Evidence: 漏斗图截图。
  - `rule` TR-13.2: 问题分类5大类总和100%。Evidence: 饼图tooltip或数据标签截图。
  - `rubric` TR-13.3: 趋势对比维度丰富度；scale 1-5；threshold>=4；anchors见AC-18。Evidence: 趋势对比全区域截图。

## Task 14: AI工作流编排界面与执行（P0-7核心）
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 1, Task 4, Task 10, Task 12
- **Description**:
  - 「AI工作流」Tab：左侧DAG可视化4节点（评论采集→情感分析→打标签→负面预警），用箭头+节点卡片串联。
  - 右侧：启动按钮、进度条（4段）、每步完成日志、Top3负面预警卡片结果区。
  - 执行逻辑：从mock/comments加载→情感打分→tagging→超阈值告警；每步延时500ms以体现流程。
- **Acceptance Criteria Addressed**: AC-8
- **Test Requirements**:
  - `rule` TR-14.1: 点击启动后进度条从0-100%递增，4步依次标记完成（绿色✓）。Evidence: 执行完截图。
  - `rule` TR-14.2: 结果区展示至少3条负面预警卡片，每张含平台、关键词、评论数、负面率。Evidence: 预警卡片截图。
  - `rule` TR-14.3: DAG 4节点用线连接，当前执行节点高亮黄色。Evidence: DAG执行中截图。

## Task 15: Python舆情抓取+情感分析脚本
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 1
- **Description**:
  - 编写 `scripts/crawl_sentiment.py`：
    - 支持 `--mock` 默认模式：生成结构化评论JSON到 `data/comments_YYYYMMDD.json`。
    - 各平台适配的抓取函数骨架（含User-Agent、请求Headers框架，返回空数组时退回到mock）。
    - 去重（基于content MD5）、按时间归档、分类。
    - 情感分析：中文关键词打分法（正向词+1分，负向词-1分）→ 归一化到sentiment + confidence。
    - 标签提取：关键词库匹配→tags数组；热度分=评论字数*权重+情感绝对值*权重。
- **Acceptance Criteria Addressed**: AC-4, AC-5, AC-12
- **Test Requirements**:
  - `rule` TR-15.1: 运行 `python scripts/crawl_sentiment.py --mock` 退出码0，data/下生成JSON文件，记录数>=50，字段完整（platform/content/author/time/sentiment/tags/hot_score）。Evidence: 脚本stdout+ls命令+JSON head 3行。
  - `rule` TR-15.2: platform字段4类全覆盖，单类占比>=10%。Evidence: Python统计脚本或jq输出。
  - `rule` TR-15.3: 抽查10条记录，sentiment取值合法，tags非空率>=90%。Evidence: 抽样检查记录表。
  - `rule` TR-15.4: 去重功能生效：手工构造2条完全相同content，最终仅保留1条。Evidence: 构造测试数据并运行脚本后的对比输出。

## Task 16: README项目说明文档（简历/面试讲解）
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None（可并行，但内容要在代码完成后最终校对）
- **Description**:
  - 编写项目根目录 `README.md`，包含8大板块：
    1. 项目简介（一句话定位+背景痛点4条）。
    2. 技术架构（目录树+模块说明+数据流向图文字版）。
    3. 功能清单（P0/P1/P2表格对照）。
    4. 运行步骤（HTML双击+Python脚本命令）。
    5. 面试讲解SOP（STAR法则：S场景/T任务/A行动/R结果，附数字量化话术）。
    6. 核心亮点与数字（覆盖X平台/X指标/端到端工作流/降低转人工率预期XX%）。
    7. 二次迭代建议（接真实大模型/接真实爬虫/接数据库/接IM机器人）。
    8. 常见问题FAQ。
- **Acceptance Criteria Addressed**: AC-20, AC-22
- **Test Requirements**:
  - `rule` TR-16.1: README.md 8大板块全部非空。Evidence: 目录结构+每板块首行截图。
  - `rule` TR-16.2: STAR讲解模板可直接套用（S/T/A/R四段齐全，含可替换占位符如【游戏名】【公司名】【XX%】）。Evidence: 模板原文抽样。
  - `rubric` TR-16.3: 代码结构与说明完整度；scale 1-5；threshold>=4；anchors见AC-20。Evidence: 目录树+README对应关系截图。

## Task 17: 总装验证+集成联调
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 4, Task 7, Task 9, Task 14, Task 15, Task 16
- **Description**:
  - 全流程联调：打开index.html→测试各Tab→执行AI工作流→校验数据更新一致性。
  - 修复所有Console报错、样式错位、数据为空的问题。
  - 最终生成一份演示检查清单（smoke test清单）。
- **Acceptance Criteria Addressed**: AC-1 ~ AC-22 全覆盖
- **Test Requirements**:
  - `rule` TR-17.1: Smoke test清单20项每项至少pass 1次。Evidence: 清单截图。
  - `rubric` TR-17.2: 业务真实性总评估；scale 1-5；threshold>=4。Evidence: 整体截图。
- **Notes**: 该任务是交付前最后一步，确保所有模块联动无断裂。
