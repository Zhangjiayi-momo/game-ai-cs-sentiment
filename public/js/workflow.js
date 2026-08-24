/**
 * workflow.js — AI 工作流编排（DAG可视化 + 四步串行执行 + 日志 + Top3负面预警）
 * 演示端到端：评论采集 → 情感AI分析 → 自动打标签 → 负面舆情预警
 * 执行时会对评论做实时再计算（而非直接取聚合结果），体现"工作流"真实流程感。
 */
(function (global) {
  'use strict';
  const WF = {};

  // DAG 4节点定义
  const STEPS = [
    { id: 'crawl',    title: '① 评论自动采集',     desc: '从 TapTap / 好游快爆 / 微博 / 贴吧 拉取公开评论', iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></svg>' },
    { id: 'sentiment',title: '② 情感AI分析',       desc: '中文关键词打分法，输出正向/中性/负向+置信度',   iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>' },
    { id: 'tagging',  title: '③ 自动打标签',       desc: '关键词库匹配，抽取行业黑话（氪金/卡顿/保底…）',  iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>' },
    { id: 'alert',    title: '④ 负面舆情预警',     desc: '超阈值自动生成预警卡片，推送给运营 / PM',        iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' }
  ];

  WF.renderDAG = function (activeIdx) {
    const el = document.getElementById('dagNodes');
    if (!el) return;
    activeIdx = typeof activeIdx === 'number' ? activeIdx : -1;
    let html = '';
    STEPS.forEach((s, i) => {
      const done = WF.done && i <= WF.doneStep;
      const active = !WF.done && i === activeIdx;
      const cls = done ? 'done' : active ? 'active' : 'pending';
      const statusText = done ? '✅ 完成' : active ? '⚡ 执行中…' : '⏸ 待执行';
      html += `
        <div class="dag-node ${cls}">
          <div class="dag-node-head">
            <div class="dag-node-icon">${s.iconSvg}</div>
            <div>
              <div class="dag-node-title">${s.title}</div>
              <div class="dag-node-desc">${s.desc}</div>
            </div>
          </div>
          <div class="dag-node-status">${statusText}</div>
        </div>
      `;
      if (i < STEPS.length - 1) {
        html += `<div class="dag-arrow ${WF.done && i < WF.doneStep ? 'done' : ''}"></div>`;
      }
    });
    el.innerHTML = html;
  };

  function addLog(text, level) {
    level = level || 'info';
    const log = document.getElementById('wfLog');
    if (!log) return;
    const d = new Date();
    const t = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0');
    const line = document.createElement('div');
    line.className = 'log-line log-' + level;
    line.textContent = `[${t}] ${text}`;
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
  }
  function setProgress(percent, label) {
    document.getElementById('wfProgressBar').style.width = percent + '%';
    document.getElementById('wfPercent').textContent = percent + '%';
    if (label) document.getElementById('wfStepLabel').textContent = label;
  }

  // 简单情感分析（与Python脚本同算法，用于前后端一致性演示）
  const POS_WORDS = ['好玩','良心','惊艳','喜欢','流畅','好评','推荐','神作','不氪','漂亮','精美','舒服','流畅','稳','香','爱'];
  const NEG_WORDS = ['闪退','卡','崩','炸','掉线','登不上','氪金','逼氪','吃相','平衡差','肝','保底歪','没出','恶心','垃圾','退游','烂','bug','糊','发烫','卡顿','掉帧','崩了','420抽'];
  function analyzeSentiment(text) {
    let score = 0;
    POS_WORDS.forEach(w => { if (text.includes(w)) score++; });
    NEG_WORDS.forEach(w => { if (text.includes(w)) score--; });
    // 归一化到 0-1
    const abs = Math.min(5, Math.abs(score));
    const conf = +(0.5 + abs * 0.1).toFixed(2);
    if (score > 0) return { sentiment: 'positive', confidence: conf, raw: score };
    if (score < 0) return { sentiment: 'negative', confidence: conf, raw: score };
    return { sentiment: 'neutral',  confidence: +(0.55 + Math.random() * 0.2).toFixed(2), raw: 0 };
  }
  function tagExtract(text) {
    const pool = ['氪金','保底','服务器','闪退','卡顿','建模','抽卡','平衡','画面','剧情','掉帧','优化','活动','客服','月卡','首充','防沉迷','匹配','深渊','公会'];
    return pool.filter(t => text.includes(t));
  }

  WF.run = async function () {
    if (WF.running) return;
    WF.running = true; WF.done = false; WF.doneStep = -1;
    const btn = document.getElementById('wfStartBtn');
    btn.disabled = true;
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>工作流执行中…';
    document.getElementById('wfLog').innerHTML = '';
    setProgress(0, '准备就绪');

    const comments = Store.listComments();
    let processed = comments.slice();

    // ============= Step 1: 采集 =============
    WF.renderDAG(0);
    addLog('STEP 1/4: 从 4 大平台拉取评论列表…', 'info');
    await sleep(600);
    // 按平台汇总
    const platCnt = {};
    processed.forEach(c => platCnt[c.platform] = (platCnt[c.platform] || 0) + 1);
    const platStr = Object.keys(platCnt).map(p => `${p} ${platCnt[p]}条`).join(' / ');
    addLog(`✓ 共采集 ${processed.length} 条评论。平台分布：${platStr}`, 'done');
    setProgress(25, '采集完成 · ' + processed.length + '条');

    // ============= Step 2: 情感分析 =============
    WF.renderDAG(1);
    addLog('STEP 2/4: 执行情感AI分析（中文关键词打分模型）…', 'info');
    await sleep(700);
    processed.forEach(c => {
      const r = analyzeSentiment(c.content);
      c.sentiment = r.sentiment; c.confidence = r.confidence;
    });
    const sc = { positive: 0, neutral: 0, negative: 0 };
    processed.forEach(c => sc[c.sentiment]++);
    addLog(`✓ 分析完成：正向 ${sc.positive} / 中性 ${sc.neutral} / 负向 ${sc.negative}`, 'done');
    setProgress(50, '情感分析完成');

    // ============= Step 3: 自动打标签 =============
    WF.renderDAG(2);
    addLog('STEP 3/4: 关键词匹配 → 行业标签抽取…', 'info');
    await sleep(600);
    processed.forEach(c => {
      const t = tagExtract(c.content);
      if (t.length) c.tags = Array.from(new Set(c.tags.concat(t))).slice(0, 5);
    });
    // 统计标签Top
    const tagMap = {};
    processed.forEach(c => c.tags.forEach(t => tagMap[t] = (tagMap[t] || 0) + 1));
    const topTags = Object.keys(tagMap).sort((a,b)=>tagMap[b]-tagMap[a]).slice(0, 5);
    addLog(`✓ 标签抽取完成，Top5：${topTags.map(t => `${t}×${tagMap[t]}`).join(' / ')}`, 'done');
    setProgress(75, '自动打标签完成');

    // ============= Step 4: 负面预警 =============
    WF.renderDAG(3);
    addLog('STEP 4/4: 负面舆情阈值判定 & 预警生成…', 'warn');
    await sleep(500);
    const threshold = Store.getAlertThreshold();
    const negRate = sc.negative / processed.length * 100;

    // 按标签聚合负面率：Top3 负面预警
    const tagStats = {};
    processed.forEach(c => {
      c.tags.forEach(t => {
        if (!tagStats[t]) tagStats[t] = { total: 0, neg: 0, pos: 0, platforms: {} };
        tagStats[t].total++;
        if (c.sentiment === 'negative') tagStats[t].neg++;
        else if (c.sentiment === 'positive') tagStats[t].pos++;
        tagStats[t].platforms[c.platform] = (tagStats[t].platforms[c.platform] || 0) + 1;
      });
    });
    const alerts = Object.keys(tagStats)
      .map(t => Object.assign({ key: t }, tagStats[t], { rate: tagStats[t].neg / Math.max(1,tagStats[t].total) * 100 }))
      .filter(x => x.total >= 3)
      .sort((a, b) => b.rate - a.rate || b.total - a.total)
      .slice(0, 3);

    renderAlerts(alerts);
    document.getElementById('wfAlertCount').textContent = alerts.length;

    if (negRate >= threshold) {
      addLog(`⚠️ 整体负面率 ${negRate.toFixed(1)}% ≥ 阈值 ${threshold}%，已触发预警横幅！`, 'warn');
    } else {
      addLog(`✓ 整体负面率 ${negRate.toFixed(1)}%，低于阈值 ${threshold}%，运营风险可控。`, 'done');
    }

    // 同步更新评论数据 + 舆情聚合 & 横幅
    Store.saveComments(processed);
    // 重新计算舆情指标
    recomputeOpinionMetrics(processed, alerts, negRate);

    setProgress(100, '✅ 工作流执行完成');
    WF.done = true; WF.doneStep = 3;
    WF.renderDAG(-1);
    addLog('========== 执行结束，用时 ≈ 2.5s ==========', 'done');
    // 刷新Dashboard
    if (typeof Dashboard !== 'undefined' && Dashboard.renderAll) Dashboard.renderAll();

    btn.disabled = false;
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>重新运行工作流';
    Utils.toast('AI 工作流执行完成，负面预警 ' + alerts.length + ' 条', alerts.length ? 'warn' : 'success');
    WF.running = false;
  };

  function renderAlerts(alerts) {
    const el = document.getElementById('wfAlertList');
    if (!el) return;
    if (!alerts.length) {
      el.innerHTML = `<div style="text-align:center;padding:24px;color:var(--c-green);">✅ 暂未检测到高风险负面舆情</div>`;
      return;
    }
    el.innerHTML = alerts.map((a, i) => {
      const plats = Object.keys(a.platforms).slice(0, 2).map(p => `<span class="chip">${p} ×${a.platforms[p]}</span>`).join('');
      return `<div class="alert-card">
        <div class="alert-card-head">
          <div class="alert-card-title">
            <span style="background:#ef4444;color:#fff;border-radius:50%;width:22px;height:22px;display:grid;place-items:center;font-size:11px;">${i + 1}</span>
            高风险：${a.key}
          </div>
          <div class="alert-card-meta">负面率 ${a.rate.toFixed(1)}%</div>
        </div>
        <div style="margin-top:4px;">${plats}</div>
        <div class="alert-card-stats">
          <div><span>${a.total}</span>评论数</div>
          <div><span style="color:var(--c-red);">${a.neg}</span>负面条数</div>
          <div><span style="color:var(--c-green);">${a.pos}</span>正向条数</div>
        </div>
      </div>`;
    }).join('');
  }

  function recomputeOpinionMetrics(processed, alerts, negRate) {
    const sentimentCount = { positive: 0, neutral: 0, negative: 0 };
    const platformCount = {};
    ['TapTap', '好游快爆', '微博', '贴吧'].forEach(p => platformCount[p] = 0);
    processed.forEach(c => {
      sentimentCount[c.sentiment]++;
      if (platformCount[c.platform] != null) platformCount[c.platform]++;
      else platformCount[c.platform] = 1;
    });
    const total = processed.length;
    const posRate = sentimentCount.positive / total * 100;
    const neuRate = sentimentCount.neutral / total * 100;

    // 热点
    const tagMap = {};
    processed.forEach(c => c.tags.forEach(t => {
      if (!tagMap[t]) tagMap[t] = { key: t, count: 0, score: 0, sample: '' };
      tagMap[t].count++;
      tagMap[t].score += c.sentiment === 'positive' ? 1 : c.sentiment === 'negative' ? -1 : 0;
      if (!tagMap[t].sample) tagMap[t].sample = c.content.slice(0, 50);
    }));
    const hotspots = Object.values(tagMap).sort((a,b)=>b.count-a.count).slice(0,6).map(h => ({
      key: h.key, count: h.count,
      sentiment: h.score > 1 ? 'positive' : h.score < -1 ? 'negative' : 'neutral',
      summary: h.sample
    }));
    // 按日期堆叠（简化，按已有时间戳聚合）
    const dailyMap = {};
    processed.forEach(c => {
      const d = c.time.slice(5, 10).replace('-', '/');
      if (!dailyMap[d]) dailyMap[d] = { date: d, positive: 0, neutral: 0, negative: 0 };
      dailyMap[d][c.sentiment]++;
    });
    const dailyStacks = Object.keys(dailyMap).sort().slice(-7).map(k => {
      const row = dailyMap[k];
      if (row.positive + row.neutral + row.negative < 4) { row.positive += 2; row.neutral += 1; row.negative += 1; }
      return row;
    });

    const op = Store.getOpMetrics() || {};
    op.totalComments = total;
    op.posRate = +posRate.toFixed(1);
    op.neuRate = +neuRate.toFixed(1);
    op.negRate = +negRate.toFixed(1);
    op.platformCount = platformCount;
    op.hotspots = hotspots;
    op.dailyStacks = dailyStacks;
    op.topNegativeKeywords = alerts.map(a => ({ key: a.key, count: a.total }));
    Store.setOpMetrics(op);
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  document.addEventListener('DOMContentLoaded', () => {
    WF.renderDAG(-1);
    document.getElementById('wfStartBtn').addEventListener('click', WF.run);
  });

  global.Workflow = WF;
})(window);
