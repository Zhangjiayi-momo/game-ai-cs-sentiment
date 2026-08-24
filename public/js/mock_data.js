/**
 * mock_data.js — 内置 Mock 数据（file:// 协议不能 fetch 本地 JSON，因此走全局变量注入）
 * 对应目录 mock/*.json 中的内容，同时也作为 Python 脚本输出 JSON 的消费格式参考。
 *
 * 数据涵盖：
 *   1. faq           - 22+ 条 FAQ，覆盖账号/充值/玩法/Bug/建议 5 大分类 + 同义词
 *   2. comments      - 80 条多平台玩家评论（4平台、情感、置信度、标签、热度）
 *   3. csMetrics     - 客服指标（KPI卡片/趋势/CSAT分布/NPS/峰值/漏斗/分类/对比）
 *   4. opinionMetrics - 舆情聚合指标（好评/差评率/热点聚类/每日堆叠/Top负面关键词）
 *   5. pendingManual - 初始待人工处理问题清单
 */
(function () {
  const CATEGORIES = ["账号问题", "充值问题", "游戏玩法", "Bug反馈", "建议投诉"];

  const faq = [
    { id: 1, q: "充值未到账怎么办？", a: "请不要重复支付！请提供【区服+角色ID+订单号+支付截图】到人工客服，我们会在1小时内为您核查补发。", category: "充值问题", synonyms: ["充值没到", "付款了没钻石", "充钱没到账"] },
    { id: 2, q: "如何修改密码？", a: "点击主界面右上角头像 → 设置 → 账号安全 → 修改密码。若忘记密码可通过绑定手机/邮箱接收验证码重置。", category: "账号问题", synonyms: ["怎么改密码", "密码忘了", "密码修改"] },
    { id: 3, q: "账号被封了怎么申诉？", a: "请通过官网→客服中心→账号申诉通道提交【账号ID、封禁截图、近期登录设备说明】，人工审核周期 1-3 个工作日。", category: "账号问题", synonyms: ["账号封禁", "被封号了", "申诉解封"] },
    { id: 4, q: "防沉迷能解除吗？", a: "根据国家规定，实名信息一经绑定不可修改。未成年用户每日 20:00-21:00 可游戏 1 小时。请您以正确实名信息登录。", category: "账号问题", synonyms: ["未成年限制", "防沉迷怎么解", "实名认证"] },
    { id: 5, q: "UP池420抽没出限定角色！", a: "请核查保底计数：UP池 90 抽保底五星，180 抽内必出当期UP。若累计计数异常，请提供抽卡记录截图+角色ID给客服核查。", category: "游戏玩法", synonyms: ["抽卡不出货", "保底没出", "小保底歪了"] },
    { id: 6, q: "怎么快速升级？", a: "优先完成每日委托+主线剧情+秘境副本。周一/周四刷天赋书、周二/周五刷武器突破材料可最大化经验效率。", category: "游戏玩法", synonyms: ["升级太慢", "快速升级攻略", "经验怎么刷"] },
    { id: 7, q: "新角色【星陨】强度如何？", a: "【星陨】为火属性主C，建议搭配四风套+暴击头/火伤杯/攻击沙。具体强度请参考官网角色测评专栏。", category: "游戏玩法", synonyms: ["星陨强不强", "新角色值得抽吗", "星陨配队"] },
    { id: 8, q: "副本BOSS打不过怎么办？", a: "建议：①拉满角色等级/天赋/圣遗物；②合理配队（奶+盾+主C+辅助）；③查看B站官方攻略视频。", category: "游戏玩法", synonyms: ["BOSS太难", "打不过副本", "深渊12层打不过"] },
    { id: 9, q: "游戏闪退进不去！", a: "请尝试：①清理后台重启设备；②更新游戏到最新版本；③安卓开启【游戏专属性能模式】；④提供设备型号+闪退时间点反馈Bug通道。", category: "Bug反馈", synonyms: ["闪退", "进不去游戏", "崩溃"] },
    { id: 10, q: "服务器炸了，登录失败？", a: "感谢反馈！我们已推送运维紧急排查。每次服务器故障会全服补偿【星晶×600】，请关注官方公告。", category: "Bug反馈", synonyms: ["登录失败", "服务器维护", "连接不上"] },
    { id: 11, q: "画面卡顿/掉帧严重？", a: "设置→画质：关闭【光追/全局光照/60帧锁定】，渲染精度调到 0.8。中端机型推荐【中画质+30帧】。", category: "Bug反馈", synonyms: ["掉帧", "卡顿", "手机发烫"] },
    { id: 12, q: "语音没声音/音效异常？", a: "①检查设备音量与游戏内音量；②设置→音频→重置音频设备；③iOS请关闭静音模式。", category: "Bug反馈", synonyms: ["没声音", "音效bug", "无声"] },
    { id: 13, q: "月卡奖励在哪里领？", a: "月卡每日奖励自动通过邮件发放，点击【邮件】图标查收。若未收到请重新登录触发。", category: "充值问题", synonyms: ["月卡没发", "月卡奖励", "大月卡"] },
    { id: 14, q: "退款流程是什么？", a: "iOS通过App Store申请「报告问题」。安卓联系对应渠道客服。游戏内无法直接退款，请保留支付凭证。", category: "充值问题", synonyms: ["怎么退款", "未成年充值退款", "退款"] },
    { id: 15, q: "能不能加个PVP模式？", a: "感谢您的建议！我们已将PVP玩法纳入Roadmap调研，若后续上线会在2.0前瞻直播公布。", category: "建议投诉", synonyms: ["希望加PVP", "想要PVP", "PVP模式"] },
    { id: 16, q: "剧情太虐心了能不能改？", a: "剧情团队非常重视玩家反馈，后续版本会增加更多轻松治愈的支线剧情，感谢理解！", category: "建议投诉", synonyms: ["剧情太刀", "改剧情", "剧情建议"] },
    { id: 17, q: "角色建模能优化吗？脸太崩了！", a: "建模组已记录反馈，会在 1.6 版本优化该角色面部光影与表情精度，敬请期待。", category: "建议投诉", synonyms: ["建模丑", "角色脸崩", "优化建模"] },
    { id: 18, q: "兑换码在哪里输入？", a: "官网首页→礼包兑换→输入角色ID+兑换码即可。或游戏内：设置→账户→礼包码兑换。每号限一次。", category: "游戏玩法", synonyms: ["礼包码", "兑换码", "CDKey"] },
    { id: 19, q: "怎么更换绑定的手机号？", a: "设置→账号安全→绑定手机→更换。需要原手机号验证码；若原号停用请走客服人工核验身份。", category: "账号问题", synonyms: ["换绑手机", "手机号更换", "改绑"] },
    { id: 20, q: "跨服好友/组队什么时候开？", a: "跨服系统计划在 1.8 版本开放，支持跨区组队、跨服聊天。请持续关注官方公告。", category: "游戏玩法", synonyms: ["跨服", "跨区", "不同服务器组队"] },
    { id: 21, q: "客服人工电话是多少？", a: "暂不提供电话客服，7×24小时工单通道在官网【客服中心】提交即可，响应SLA 30分钟内。", category: "账号问题", synonyms: ["人工客服", "客服电话", "联系客服"] },
    { id: 22, q: "首充奖励没发？", a: "首充任意金额后奖励邮件发放，若延迟请 ①完成新手引导；②重登一次；③仍未收到请反馈订单号。", category: "充值问题", synonyms: ["首充没到", "首充奖励", "首充"] }
  ];

  // ====================== 评论生成 ======================
  const PLATFORMS = ["TapTap", "好游快爆", "微博", "贴吧"];
  const SENTIMENT_META = {
    positive: {
      w: ["超爱", "太好玩了", "吹爆", "yyds", "神作", "惊艳", "良心", "不氪也能玩", "画面太美", "剧情封神", "打击感拉满", "老婆好美"],
      tags: ["画面惊艳", "玩法丰富", "剧情好评", "角色塑造", "不逼氪", "BGM优秀", "抽卡良心"]
    },
    neutral: {
      w: ["还行吧", "一般般", "中规中矩", "可以试试", "观望中", "等优化", "仁者见仁", "看后续", "过得去", "先四星"],
      tags: ["内容偏少", "UI一般", "优化一般", "玩法中规", "期待更新"]
    },
    negative: {
      w: ["太氪了", "保底歪了", "420抽没出", "服务器又炸了", "卡死了", "闪退N次", "剧情太刀了", "建模崩了", "平衡稀烂", "吃相难看", "客服机器人", "登不上", "掉帧严重", "P2W"],
      tags: ["氪金严重", "服务器卡顿", "抽卡概率", "平衡问题", "闪退Bug", "掉帧", "建模崩坏", "客服响应慢", "剧情不适"]
    }
  };
  const AUTHORS = ["星陨纪忠实玩家", "萌新入坑第3天", "二次元老油条", "开服零氪党", "氪金大佬XXX", "佛系养老选手", "抽卡必欧皇", "手残操作流", "重度颜值党", "剧情考据党"];
  const REFS = ["星陨纪", "新池UP【星陨】", "深渊12层", "风蚀峡谷副本", "周年庆版本", "1.5更新后", "限定角色「月白」", "公会战S3赛季"];

  function pickW(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function pickN(arr, n) { return arr.slice().sort(() => Math.random() - 0.5).slice(0, n); }
  function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function fmtDate(d) { return d.toISOString().slice(0, 19).replace('T', ' '); }

  // 加权分布（负面35%触发预警横幅）
  function pickSentiment() {
    const r = Math.random();
    if (r < 0.35) return "negative";
    if (r < 0.65) return "positive";
    return "neutral";
  }
  function pickPlatform() {
    const r = Math.random();
    if (r < 0.32) return "TapTap";
    if (r < 0.55) return "好游快爆";
    if (r < 0.80) return "微博";
    return "贴吧";
  }

  const comments = [];
  for (let i = 0; i < 80; i++) {
    const plat = pickPlatform();
    const sk = pickSentiment();
    const meta = SENTIMENT_META[sk];
    const w = pickN(meta.w, rand(1, 2));
    const ref = pickW(REFS);
    let tail;
    if (sk === "negative") tail = "希望官方尽快修复！不然真的要退游了。";
    else if (sk === "positive") tail = "继续加油，希望多出点联动活动～";
    else tail = "先观望，等后续版本再改评分。";
    const content = ref + "体验：" + w.join("，") + "。" + tail;
    const daysAgo = rand(0, 6);
    const hoursAgo = rand(0, 23);
    const t = new Date(Date.now() - daysAgo * 86400000 - hoursAgo * 3600000);
    const confidence = +(0.65 + Math.random() * 0.34).toFixed(2);
    const tags = pickN(meta.tags, rand(2, 4));
    const hotScore = Math.round(content.length * 0.3 + (sk === "negative" ? 50 : 20) + Math.random() * 30);
    comments.push({
      id: i + 1, platform: plat,
      author: AUTHORS[i % AUTHORS.length] + rand(100, 999),
      content, time: fmtDate(t),
      sentiment: sk, confidence, tags, hot_score: hotScore
    });
  }

  // ====================== 客服指标 ======================
  function labels7() {
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      out.push((d.getMonth() + 1) + "/" + d.getDate());
    }
    return out;
  }
  const L7 = labels7();

  const csMetrics = {
    current: { avgResponseTime: 12.6, firstContactRate: 87.3, transferRate: 12.4, csat: 4.3, nps: 38, totalSessions: 3245, totalTransfers: 402 },
    prev:    { avgResponseTime: 14.2, firstContactRate: 84.1, transferRate: 15.6, csat: 4.1, nps: 31 },
    trend: {
      avgResponseTime: [15.2, 14.8, 14.0, 13.5, 13.1, 12.8, 12.6],
      firstContactRate: [82.0, 83.1, 84.5, 85.0, 86.2, 87.0, 87.3],
      transferRate:     [17.0, 16.5, 16.0, 15.6, 14.0, 13.2, 12.4],
      csat:             [4.0, 4.0, 4.1, 4.1, 4.2, 4.3, 4.3]
    },
    labels7: L7,
    csatDist:       { stars: [1,2,3,4,5], counts: [85, 120, 310, 1180, 1550] },
    npsDist:        { categories: ["贬损者(0-6)","被动者(7-8)","推荐者(9-10)"], values: [22, 35, 43] },
    hourlyPeak:     Array.from({length:24}, (_,h) => ({ hour: h, count: Math.round(60 + 50*Math.sin((h-10)*Math.PI/12) + Math.random()*25 + (h>=19 && h<=22 ? 130 : 0)) })),
    transferReasons:{ categories: ["AI无法解答","态度不满","问题复杂","其他"], values: [210, 42, 115, 35] },
    funnel:         { levels: ["总咨询量","AI匹配成功","需追问","转人工"], values: [3245, 2630, 520, 402] },
    categoryDist:   { categories: CATEGORIES.slice(), values: [620, 540, 1080, 550, 455] },
    last7_vs_last14:{ labels7: L7, last7: [320,350,410,430,500,580,655], prev7: [280,290,300,310,380,420,440] }
  };

  // ====================== 舆情聚合 ======================
  const sentimentCount = { positive: 0, neutral: 0, negative: 0 };
  const platformCount = {};
  PLATFORMS.forEach(p => platformCount[p] = 0);
  comments.forEach(c => { sentimentCount[c.sentiment]++; platformCount[c.platform]++; });
  const posRate = +(sentimentCount.positive / comments.length * 100).toFixed(1);
  const neuRate = +(sentimentCount.neutral / comments.length * 100).toFixed(1);
  const negRate = +(sentimentCount.negative / comments.length * 100).toFixed(1);

  const tagMap = {};
  comments.forEach(c => c.tags.forEach(t => {
    if (!tagMap[t]) tagMap[t] = { key: t, count: 0, score: 0, sample: "" };
    tagMap[t].count++;
    tagMap[t].score += c.sentiment === "positive" ? 1 : c.sentiment === "negative" ? -1 : 0;
    if (!tagMap[t].sample) tagMap[t].sample = c.content;
  }));
  const hotspots = Object.values(tagMap).sort((a,b) => b.count - a.count).slice(0, 6).map(h => ({
    key: h.key, count: h.count,
    sentiment: h.score > 1 ? "positive" : h.score < -1 ? "negative" : "neutral",
    summary: h.sample.slice(0, 50) + (h.sample.length > 50 ? "…" : "")
  }));

  const dailyStacks = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = (d.getMonth() + 1) + "/" + d.getDate();
    let p = 0, n = 0, neg = 0;
    comments.forEach(c => {
      const cd = c.time.slice(5, 10).replace("-", "/");
      if (cd === key) {
        if (c.sentiment === "positive") p++;
        else if (c.sentiment === "neutral") n++;
        else neg++;
      }
    });
    if (p + n + neg < 5) { p += 3; n += 2; neg += 2; }
    dailyStacks.push({ date: key, positive: p, neutral: n, negative: neg });
  }
  const topNegative = hotspots.filter(h => h.sentiment === "negative").slice(0, 3);

  const opinionMetrics = {
    totalComments: comments.length, posRate, neuRate, negRate, platformCount,
    hotspots, dailyStacks, alertThreshold: 30,
    topNegativeKeywords: topNegative.length ? topNegative : hotspots.slice(0, 3)
  };

  const pendingManual = [
    { id: 1, question: "你们制作组会做DLC吗？", time: fmtDate(new Date(Date.now() - 3600000 * 2)), status: "待处理" },
    { id: 2, question: "有没有同人二创授权政策？", time: fmtDate(new Date(Date.now() - 3600000 * 5)), status: "待处理" }
  ];

  // ====================== 导出 ======================
  window.__MOCK__ = { faq, comments, csMetrics, opinionMetrics, pendingManual };
})();
