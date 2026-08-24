/**
 * dashboard.js — 数据看板（客服指标 / 舆情监控 / 产品分析 全部图表与交互）
 * 依赖：Store、Utils、Chart.js (window.Chart)
 * 所有图表缓存到 charts 对象，首次创建后更新数据而非重复创建。
 */
(function (global) {
  'use strict';
  const Dashboard = {};
  const charts = {}; // 缓存：id -> Chart实例

  // ========== 主题配色（亮/暗两套，传给Chart.js） ==========
  function palette() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      text:    isDark ? '#A5ACC8' : '#64748B',
      grid:    isDark ? '#283165' : '#E2E8F0',
      cardBg:  isDark ? '#121832' : '#FFFFFF',
      primary: '#8B5CF6',
      primary2: '#6366F1',
      accent:  '#22D3EE',
      green:   '#10B981',
      yellow:  '#F59E0B',
      red:     '#EF4444',
      orange:  '#F97316',
      purple:  '#A855F7',
      blue:    '#3B82F6'
    };
  }
  function grad(ctx, color1, color2, horizontal) {
    const c = ctx.chart.ctx;
    const { chartArea } = ctx;
    if (!chartArea) return color1;
    const w = chartArea.right - chartArea.left;
    const h = chartArea.bottom - chartArea.top;
    const g = c.createLinearGradient(
      horizontal ? chartArea.left : 0,
      horizontal ? 0 : chartArea.top,
      horizontal ? chartArea.right : 0,
      horizontal ? 0 : chartArea.bottom
    );
    g.addColorStop(0, color1);
    g.addColorStop(1, color2);
    return g;
  }
  function baseOptions() {
    const p = palette();
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: p.text, font: { size: 11 }, padding: 10, usePointStyle: true, pointStyle: 'circle' } },
        tooltip: {
          backgroundColor: p.cardBg,
          titleColor: p.text,
          bodyColor: p.text,
          borderColor: p.grid,
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
          boxPadding: 4
        }
      },
      scales: {
        x: { ticks: { color: p.text, font: { size: 10 } }, grid: { color: p.grid, drawBorder: false } },
        y: { ticks: { color: p.text, font: { size: 10 } }, grid: { color: p.grid, drawBorder: false }, beginAtZero: true }
      }
    };
  }
  // 销毁并重建缓存中指定id的图表
  function rebuild(id, cfg) {
    if (charts[id]) { charts[id].destroy(); delete charts[id]; }
    const ctx = document.getElementById(id);
    if (!ctx) return null;
    charts[id] = new Chart(ctx, cfg);
    return charts[id];
  }

  // ============================================================
  // 客服指标 P0 + P1
  // ============================================================
  Dashboard.renderCS = function () {
    const m = Store.getCSMetrics();
    const p = palette();
    if (!m || !m.labels7) return;
    const base = baseOptions();

    // -- 响应时长折线
    rebuild('chartResponseTime', {
      type: 'line',
      data: {
        labels: m.labels7,
        datasets: [{
          label: '响应时长 (秒)',
          data: m.trend.avgResponseTime,
          borderColor: p.primary2,
          backgroundColor: c => grad(c, 'rgba(99,102,241,.45)', 'rgba(99,102,241,0)', false),
          borderWidth: 2.5,
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: p.primary2,
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: Object.assign({}, base, { scales: { x: base.scales.x, y: Object.assign({}, base.scales.y, { ticks: Object.assign({}, base.scales.y.ticks, { callback: v => v + 's' }) }) } })
    });

    // -- 首次解决率折线
    rebuild('chartFirstContact', {
      type: 'line',
      data: {
        labels: m.labels7,
        datasets: [{
          label: '首次解决率 (%)',
          data: m.trend.firstContactRate,
          borderColor: p.green,
          backgroundColor: c => grad(c, 'rgba(16,185,129,.4)', 'rgba(16,185,129,0)', false),
          borderWidth: 2.5, tension: 0.4, fill: true,
          pointRadius: 3, pointBackgroundColor: p.green, pointBorderColor: '#fff', pointBorderWidth: 2
        }]
      },
      options: Object.assign({}, base, { scales: { x: base.scales.x, y: Object.assign({}, base.scales.y, { min: 70, max: 100, ticks: Object.assign({}, base.scales.y.ticks, { callback: v => v + '%' }) }) } })
    });

    // -- CSAT分布 条形
    rebuild('chartCSAT', {
      type: 'bar',
      data: {
        labels: ['★ 1分', '★★ 2分', '★★★ 3分', '★★★★ 4分', '★★★★★ 5分'],
        datasets: [{
          label: '评分数量',
          data: m.csatDist.counts,
          backgroundColor: ['#EF4444', '#F97316', '#F59E0B', '#6366F1', '#10B981'],
          borderRadius: 8,
          borderSkipped: false,
          barThickness: 20
        }]
      },
      options: base
    });

    // -- NPS 环形
    const npsColors = ['#EF4444', '#F59E0B', '#10B981'];
    rebuild('chartNPS', {
      type: 'doughnut',
      data: {
        labels: m.npsDist.categories,
        datasets: [{
          data: m.npsDist.values,
          backgroundColor: npsColors,
          borderColor: p.cardBg,
          borderWidth: 3,
          hoverOffset: 8
        }]
      },
      options: Object.assign({}, base, {
        cutout: '70%',
        plugins: {
          legend: base.plugins.legend,
          tooltip: base.plugins.tooltip,
          doughnutCenter: {} // (占位：稍后onResize用)
        }
      }
      )
    });
    const npsBadge = document.getElementById('npsBadge');
    if (npsBadge) npsBadge.textContent = m.current.nps;

    // -- 24h咨询峰值 柱状
    rebuild('chartHourlyPeak', {
      type: 'bar',
      data: {
        labels: m.hourlyPeak.map(x => x.hour + '时'),
        datasets: [{
          label: '咨询量',
          data: m.hourlyPeak.map(x => x.count),
          backgroundColor: c => grad(c, '#6366F1', '#A855F7', true),
          borderRadius: 4,
          borderSkipped: false
        }]
      },
      options: Object.assign({}, base, { plugins: { legend: { display: false }, tooltip: base.plugins.tooltip }, scales: { x: Object.assign({}, base.scales.x, { ticks: Object.assign({}, base.scales.x.ticks, { maxRotation: 0, autoSkip: true, maxTicksLimit: 12 }) }), y: base.scales.y } })
    });

    // -- 转人工原因饼图
    rebuild('chartTransferReason', {
      type: 'pie',
      data: {
        labels: m.transferReasons.categories,
        datasets: [{
          data: m.transferReasons.values,
          backgroundColor: [p.primary2, p.red, p.yellow, p.text],
          borderColor: p.cardBg, borderWidth: 3, hoverOffset: 8
        }]
      },
      options: base
    });

    // -- KPI mini sparklines (新增 4 个 canvas)
    const sparkOpt = (color, fill1, fill2) => Object.assign({}, baseOptions(), {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: base.plugins.tooltip },
      scales: { x: { display: false }, y: { display: false } },
      elements: { point: { radius: 0 }, line: { borderWidth: 2 } }
    });
    rebuild('kpiSparkResponse', {
      type: 'line',
      data: { labels: m.labels7, datasets: [{ data: m.trend.avgResponseTime, borderColor: p.primary2, backgroundColor: c => grad(c, fill1 || 'rgba(99,102,241,.35)', fill2 || 'rgba(99,102,241,0)', false), fill: true, tension: .45 }] },
      options: sparkOpt()
    });
    rebuild('kpiSparkFCR', {
      type: 'line',
      data: { labels: m.labels7, datasets: [{ data: m.trend.firstContactRate, borderColor: p.green, backgroundColor: c => grad(c, 'rgba(16,185,129,.35)', 'rgba(16,185,129,0)', false), fill: true, tension: .45 }] },
      options: sparkOpt()
    });
    rebuild('kpiSparkTransfer', {
      type: 'line',
      data: { labels: m.labels7, datasets: [{ data: m.trend.transferRate, borderColor: p.orange, backgroundColor: c => grad(c, 'rgba(249,115,22,.3)', 'rgba(249,115,22,0)', false), fill: true, tension: .45 }] },
      options: sparkOpt()
    });
    rebuild('kpiSparkCSAT', {
      type: 'line',
      data: { labels: m.labels7, datasets: [{ data: m.trend.csat, borderColor: p.purple, backgroundColor: c => grad(c, 'rgba(168,85,247,.32)', 'rgba(168,85,247,0)', false), fill: true, tension: .45 }] },
      options: sparkOpt()
    });
  };

  // ============================================================
  // 舆情监控 P0 + P1
  // ============================================================
  Dashboard.renderOpinion = function () {
    const o = Store.getOpMetrics();
    const p = palette();
    if (!o) return;

    // KPI
    document.getElementById('opTotal').textContent = o.totalComments;
    document.getElementById('opPos').innerHTML = o.posRate.toFixed(1) + '<span class="unit">%</span>';
    document.getElementById('opNeg').innerHTML = o.negRate.toFixed(1) + '<span class="unit">%</span>';

    // -- 情感分布环形
    rebuild('chartSentiment', {
      type: 'doughnut',
      data: {
        labels: ['正向好评', '中性', '负向差评'],
        datasets: [{
          data: [o.posRate, o.neuRate, o.negRate],
          backgroundColor: [p.green, (document.documentElement.getAttribute('data-theme') === 'dark' ? '#475569' : '#CBD5E1'), p.red],
          borderColor: p.cardBg, borderWidth: 3, hoverOffset: 10
        }]
      },
      options: Object.assign({}, baseOptions(), { cutout: '65%' })
    });

    // -- 每日堆叠柱状
    const base = baseOptions();
    rebuild('chartDailyStack', {
      type: 'bar',
      data: {
        labels: o.dailyStacks.map(x => x.date),
        datasets: [
          { label: '正向', data: o.dailyStacks.map(x => x.positive), backgroundColor: p.green, borderRadius: 0, stack: 's' },
          { label: '中性', data: o.dailyStacks.map(x => x.neutral), backgroundColor: p.yellow, borderRadius: 0, stack: 's' },
          { label: '负向', data: o.dailyStacks.map(x => x.negative), backgroundColor: p.red, borderRadius: 4, borderSkipped: false, stack: 's' }
        ]
      },
      options: Object.assign({}, base, { scales: { x: base.scales.x, y: Object.assign({}, base.scales.y, { stacked: true }) } })
    });

    // -- 热点聚类卡片
    renderHotspots(o.hotspots);

    // -- 平台分布
    const plats = Object.keys(o.platformCount);
    rebuild('chartPlatform', {
      type: 'bar',
      data: {
        labels: plats,
        datasets: [{
          label: '评论数',
          data: plats.map(pl => o.platformCount[pl]),
          backgroundColor: c => grad(c, '#22D3EE', '#8B5CF6', true),
          borderRadius: 8, borderSkipped: false, barThickness: 28
        }]
      },
      options: Object.assign({}, base, { indexAxis: 'y', plugins: { legend: { display: false }, tooltip: base.plugins.tooltip }, scales: { x: base.scales.y, y: Object.assign({}, baseOptions().scales.x, { grid: { display: false } }) } })
    });

    // -- 评论列表
    renderCommentList();
    updateAlertBanner();

    // -- 舆情 KPI sparklines（4 个 mini canvas）
    const osOpt = Object.assign({}, baseOptions(), {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: base.plugins.tooltip },
      scales: { x: { display: false }, y: { display: false } },
      elements: { point: { radius: 0 }, line: { borderWidth: 2 } }
    });
    const last7 = (o.dailyStacks || []).slice(-7);
    rebuild('kpiSparkTotal', {
      type: 'line', data: {
        labels: last7.map(x => x.date),
        datasets: [{ data: last7.map(x => (x.positive||0)+(x.neutral||0)+(x.negative||0)), borderColor: p.primary2,
          backgroundColor: c => grad(c, 'rgba(99,102,241,.3)', 'rgba(99,102,241,0)', false), fill: true, tension: .45 }]
      }, options: osOpt
    });
    rebuild('kpiSparkPos', {
      type: 'line', data: {
        labels: last7.map(x => x.date),
        datasets: [{ data: last7.map(x => x.positive||0), borderColor: p.green,
          backgroundColor: c => grad(c, 'rgba(16,185,129,.3)', 'rgba(16,185,129,0)', false), fill: true, tension: .45 }]
      }, options: osOpt
    });
    rebuild('kpiSparkNeg', {
      type: 'line', data: {
        labels: last7.map(x => x.date),
        datasets: [{ data: last7.map(x => x.negative||0), borderColor: p.red,
          backgroundColor: c => grad(c, 'rgba(239,68,68,.3)', 'rgba(239,68,68,0)', false), fill: true, tension: .45 }]
      }, options: osOpt
    });
    // 平台数覆盖（按累计绘制条形mini）
    rebuild('kpiSparkPlat', {
      type: 'bar', data: {
        labels: Object.keys(o.platformCount || {}),
        datasets: [{ data: Object.values(o.platformCount || {}), backgroundColor: [p.primary2, p.accent, p.yellow, p.purple], borderRadius: 4, borderSkipped: false }]
      }, options: Object.assign({}, osOpt, { scales: { x: { display: false }, y: { display: false, beginAtZero: true } } })
    });
  };

  function renderHotspots(hotspots) {
    const el = document.getElementById('hotspotList');
    if (!el) return;
    el.innerHTML = hotspots.map((h, i) => {
      const sClass = h.sentiment === 'positive' ? 'sentiment-positive' : h.sentiment === 'negative' ? 'sentiment-negative' : 'sentiment-neutral';
      const sText = h.sentiment === 'positive' ? '正向' : h.sentiment === 'negative' ? '负向' : '中性';
      return `<div class="hotspot-card">
        <div class="hotspot-head">
          <div class="hotspot-key">
            <span style="background:var(--c-gradient);color:#fff;border-radius:50%;width:22px;height:22px;display:grid;place-items:center;font-size:11px;">${i + 1}</span>
            ${esc(h.key)}
          </div>
          <div class="hotspot-count">
            <span class="sentiment-label ${sClass}" style="margin-right:6px;">${sText}</span>
            ${h.count} 条
          </div>
        </div>
        <div class="hotspot-summary">“${esc(h.summary)}”</div>
      </div>`;
    }).join('');
  }

  // 评论列表渲染
  let filterSentiment = '', filterPlatform = '', hlKw = '';
  function renderCommentList() {
    const all = Store.listComments();
    let list = all;
    if (filterSentiment) list = list.filter(c => c.sentiment === filterSentiment);
    if (filterPlatform)  list = list.filter(c => c.platform === filterPlatform);
    document.getElementById('commentCountShow').textContent = list.length;

    const hl = hlKw.trim();
    const el = document.getElementById('commentList');
    if (!el) return;
    el.innerHTML = list.slice(0, 120).map(c => {
      const sClass = 'sentiment-' + c.sentiment;
      const sText = c.sentiment === 'positive' ? '正向' : c.sentiment === 'negative' ? '负向' : '中性';
      const platIcons = { TapTap: '🎮', '好游快爆': '⚡', '微博': '🐦', '贴吧': '📌' };
      const hasHl = hl && (c.content.includes(hl) || c.tags.some(t => t.includes(hl)));
      return `<div class="comment-item ${hasHl ? 'hl' : ''}">
        <div class="comment-head">
          <div class="comment-head-left">
            <span class="comment-platform">${platIcons[c.platform] || '💬'} ${esc(c.platform)}</span>
            <span class="comment-author">${esc(c.author)}</span>
            <span class="sentiment-label ${sClass}">${sText} ${Math.round(c.confidence * 100)}%</span>
          </div>
          <div class="comment-time">${esc(c.time)}</div>
        </div>
        <div class="comment-content">${hl ? highlight(c.content, hl) : esc(c.content)}</div>
        <div class="comment-foot">
          <div>${c.tags.map(t => `<span class="chip">${hl ? highlight(t, hl) : esc(t)}</span>`).join('')}</div>
          <div class="hot-score">🔥 ${c.hot_score}</div>
        </div>
      </div>`;
    }).join('') || `<div style="text-align:center;padding:30px;color:var(--text-3);font-size:12px;">没有符合条件的评论</div>`;
  }

  function highlight(text, kw) {
    if (!kw) return esc(text);
    try {
      const re = new RegExp('(' + kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + ')', 'g');
      return esc(text).replace(re, '<mark style="background:#fde68a;color:#92400e;border-radius:3px;padding:1px 2px;">$1</mark>');
    } catch (e) { return esc(text); }
  }

  // ============================================================
  // 产品分析 P2
  // ============================================================
  Dashboard.renderProduct = function () {
    const m = Store.getCSMetrics();
    if (!m) return;
    // 漏斗（纯CSS）
    renderFunnel(m.funnel);
    const p = palette();
    // 问题分类占比
    rebuild('chartCategory', {
      type: 'pie',
      data: {
        labels: m.categoryDist.categories,
        datasets: [{
          data: m.categoryDist.values,
          backgroundColor: [p.primary2, p.yellow, p.purple, p.red, p.green],
          borderColor: (palette().cardBg), borderWidth: 3, hoverOffset: 8
        }]
      },
      options: baseOptions()
    });
    // 近7日 vs 上7日
    const base = baseOptions();
    rebuild('chart7v7', {
      type: 'line',
      data: {
        labels: m.last7_vs_last14.labels7,
        datasets: [
          {
            label: '近7日咨询量',
            data: m.last7_vs_last14.last7,
            borderColor: p.primary2,
            backgroundColor: c => grad(c, 'rgba(99,102,241,.35)', 'rgba(99,102,241,0)', false),
            borderWidth: 2.5, tension: 0.4, fill: true, pointRadius: 3, pointBackgroundColor: p.primary2
          },
          {
            label: '上7日咨询量',
            data: m.last7_vs_last14.prev7,
            borderColor: p.accent,
            backgroundColor: 'rgba(34,211,238,.12)',
            borderWidth: 2, tension: 0.4,
            borderDash: [6, 4], fill: false, pointRadius: 3, pointBackgroundColor: p.accent, pointStyle: 'rectRot'
          }
        ]
      },
      options: base
    });

    // -- 新增 P2 产品分析 5 个 canvas --
    // 1) 漏斗各层流失 mini 趋势
    rebuild('chartFunnelRate', {
      type: 'line',
      data: {
        labels: m.funnel.levels,
        datasets: [
          { label: '留存率(%)', data: m.funnel.values.map((v,i)=>i===0?100:(v/m.funnel.values[0]*100)),
            borderColor: p.primary2, backgroundColor: c => grad(c,'rgba(99,102,241,.35)','rgba(99,102,241,0)',false),
            fill:true, tension:.4, borderWidth:2 }
        ]
      },
      options: Object.assign({}, baseOptions(), {
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: base.plugins.tooltip },
        scales: {
          x: Object.assign({}, base.scales.x, { ticks: { color: palette().text3, maxRotation:0 } }),
          y: Object.assign({}, base.scales.y, { ticks: { color: palette().text3, maxTicksLimit: 5, callback: v=>v+'%' } })
        }
      })
    });

    // 2) 分类分布极坐标 radar
    const radarColors = [p.primary2, p.yellow, p.purple, p.red, p.green];
    rebuild('chartCategoryPolar', {
      type: 'radar',
      data: {
        labels: m.categoryDist.categories,
        datasets: [{
          label: '占比分布',
          data: m.categoryDist.values,
          backgroundColor: 'rgba(99,102,241,.25)',
          borderColor: p.primary2,
          pointBackgroundColor: radarColors,
          pointBorderColor: palette().cardBg,
          pointRadius: 4
        }]
      },
      options: Object.assign({}, baseOptions(), {
        maintainAspectRatio: false,
        scales: {
          r: {
            ticks: { color: palette().text3, backdropColor: 'transparent', maxTicksLimit: 5 },
            grid: { color: palette().grid },
            angleLines: { color: palette().grid },
            pointLabels: { color: palette().text }
          }
        },
        plugins: { legend: { display: false }, tooltip: base.plugins.tooltip }
      })
    });

    // 3) 分类趋势堆叠（近7日，若未提供则构造 mock）
    const labs7 = m.labels7 || m.last7_vs_last14.labels7 || [];
    const cats = m.categoryDist.categories || [];
    const catTrendDatasets = cats.map((cat,i)=>{
      const base = Math.max(6, Math.round(m.categoryDist.values[i] / labs7.length));
      return {
        label: cat,
        data: labs7.map((_,d) => Math.max(1, base + Math.round(Math.sin((d+i)*1.1) * base*0.35 + (i%2?1:-1)*Math.random()*base*0.2))),
        backgroundColor: radarColors[i],
        stack: 'cat',
        borderRadius: 2,
        borderSkipped: false
      };
    });
    rebuild('chartCatTrend', {
      type: 'bar',
      data: { labels: labs7, datasets: catTrendDatasets },
      options: Object.assign({}, baseOptions(), {
        plugins: Object.assign({}, base.plugins, { legend: { position: 'bottom', labels: { color: palette().text, boxWidth: 10, padding: 8 } }, tooltip: base.plugins.tooltip }),
        scales: {
          x: Object.assign({}, base.scales.x, { stacked: true, grid: { display: false } }),
          y: Object.assign({}, base.scales.y, { stacked: true })
        }
      })
    });

    // 4) AI 命中率 vs 转人工率 气泡
    const fcr = m.trend && m.trend.firstContactRate ? m.trend.firstContactRate : [72,74,75,73,77,78,80];
    const tr  = m.trend && m.trend.transferRate       ? m.trend.transferRate       : [15,14,12,13,11,10,9];
    const vol = (m.last7_vs_last14 && m.last7_vs_last14.last7) ? m.last7_vs_last14.last7 : [420,460,510,480,530,560,590];
    rebuild('chartFCRvsTransfer', {
      type: 'bubble',
      data: {
        datasets: [{
          label: '每日二维表现',
          data: labs7.map((_,i)=>({ x: fcr[i]||80, y: tr[i]||10, r: 5 + Math.min(14, (vol[i]||500)/80) })),
          backgroundColor: c => grad(c, 'rgba(168,85,247,.55)', 'rgba(99,102,241,.55)', true),
          borderColor: palette().cardBg,
          borderWidth: 2
        }]
      },
      options: Object.assign({}, baseOptions(), {
        plugins: Object.assign({}, base.plugins, { legend: { display: false }, tooltip: {
          ...base.plugins.tooltip,
          callbacks: { label: (ctx)=> `FCR ${ctx.raw.x.toFixed(1)}% · 转人工 ${ctx.raw.y.toFixed(1)}%` }
        }}),
        scales: {
          x: Object.assign({}, base.scales.x, { title: { display: true, text: 'AI 一次解决率 (%)', color: palette().text2 }, ticks: { color: palette().text3 } }),
          y: Object.assign({}, base.scales.y, { title: { display: true, text: '转人工率 (%)', color: palette().text2 }, ticks: { color: palette().text3 }, reverse: true })
        }
      })
    });

    // 5) 服务质量雷达（5维度）
    rebuild('chartQualityRadar', {
      type: 'radar',
      data: {
        labels: ['响应速度','解决质量','耐心友好','专业准确','整体满意'],
        datasets: [
          {
            label: '本周均值',
            data: [86, 83, 90, 81, 88],
            backgroundColor: 'rgba(16,185,129,.25)',
            borderColor: p.green,
            pointBackgroundColor: p.green,
            pointBorderColor: palette().cardBg,
            pointRadius: 4
          },
          {
            label: '上周均值',
            data: [82, 80, 87, 78, 85],
            backgroundColor: 'rgba(99,102,241,.2)',
            borderColor: p.primary2,
            pointBackgroundColor: p.primary2,
            pointBorderColor: palette().cardBg,
            pointRadius: 3
          }
        ]
      },
      options: Object.assign({}, baseOptions(), {
        scales: {
          r: {
            suggestedMin: 60, suggestedMax: 100,
            ticks: { color: palette().text3, backdropColor: 'transparent', stepSize: 10 },
            grid: { color: palette().grid },
            angleLines: { color: palette().grid },
            pointLabels: { color: palette().text }
          }
        },
        plugins: Object.assign({}, base.plugins, { legend: { position: 'bottom', labels: { color: palette().text, boxWidth: 10, padding: 8 } }, tooltip: base.plugins.tooltip })
      })
    });
  };

  function renderFunnel(funnel) {
    const el = document.getElementById('funnelChart');
    if (!el || !funnel) return;
    const vals = funnel.values;
    const max = Math.max.apply(null, vals);
    const html = funnel.levels.map((lv, i) => {
      const w = Math.max(22, (vals[i] / max) * 100);
      const convRate = i === 0 ? 100 : ((vals[i] / vals[0]) * 100);
      const lossVsPrev = i === 0 ? 0 : (((vals[i - 1] - vals[i]) / vals[i - 1]) * 100);
      return `<div class="funnel-row">
        <div class="funnel-label">${esc(lv)}</div>
        <div class="funnel-bar-wrap">
          <div class="funnel-bar" style="width:${w}%;">${vals[i].toLocaleString()} 次</div>
        </div>
        <div class="funnel-value">${convRate.toFixed(1)}%
          <small>${i === 0 ? '基准层' : '较上层↓ ' + lossVsPrev.toFixed(1) + '%'}</small>
        </div>
      </div>`;
    }).join('');
    el.innerHTML = html;
  }

  // ============================================================
  // 预警横幅 & 阈值设置
  // ============================================================
  function updateAlertBanner() {
    const o = Store.getOpMetrics();
    if (!o) return;
    const threshold = Store.getAlertThreshold();
    const banner = document.getElementById('alertBanner');
    if (!banner) return;
    if (o.negRate >= threshold) {
      banner.classList.add('show');
      const kw = (o.topNegativeKeywords && o.topNegativeKeywords.length)
        ? o.topNegativeKeywords.map(k => '【' + k.key + '】').join('')
        : '【暂无】';
      document.getElementById('alertText').textContent =
        `今日负面评论占比 ${o.negRate.toFixed(1)}%（阈值 ${threshold}%），主要集中在${kw}，建议运营团队立即介入。`;
    } else {
      banner.classList.remove('show');
    }
  }
  Dashboard.updateAlertBanner = updateAlertBanner;

  // ============================================================
  // 舆情日报生成
  // ============================================================
  Dashboard.generateReport = function () {
    const o = Store.getOpMetrics();
    const m = Store.getCSMetrics();
    if (!o || !m) return;
    const today = new Date();
    const dateStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    document.getElementById('reportDate').textContent = dateStr;
    const platStr = Object.keys(o.platformCount).map(k => `    · ${k}：${o.platformCount[k]} 条 (${(o.platformCount[k] / o.totalComments * 100).toFixed(1)}%)`).join('\n');
    const top3Hot = (o.hotspots || []).slice(0, 3).map((h, i) => `    ${i + 1}. ${h.key} — ${h.count} 条（${h.sentiment === 'positive' ? '正向' : h.sentiment === 'negative' ? '负向⚠️' : '中性'}） 摘要：${h.summary}`).join('\n');
    const topNeg = (o.topNegativeKeywords || []).map(k => `    · 高风险关键词【${k.key}】：${k.count} 条负面舆情`).join('\n') || '    · 无突发高风险关键词';
    const text =
`# 《星陨纪》每日舆情与客服运营日报 · ${dateStr}

## 一、客服核心运营指标
- 总咨询量：${m.current.totalSessions} 次（环比 ↑ ${((m.current.totalSessions - 2900) / 2900 * 100).toFixed(1)}%）
- 平均响应时长：${m.current.avgResponseTime}s，首次解决率 ${m.current.firstContactRate}%，转人工率 ${m.current.transferRate}%
- CSAT 满意度：${m.current.csat} / 5；NPS 净推荐值：${m.current.nps}

## 二、全网舆情总量
- 今日全平台抓取评论总数：${o.totalComments} 条
- 平台分布：
${platStr}
- 综合情感分布：正向 ${o.posRate}% / 中性 ${o.neuRate}% / 负向 ${o.negRate}%

## 三、Top3 热点事件聚类
${top3Hot}

## 四、负面舆情预警清单
${topNeg}
- 当前预警阈值：${Store.getAlertThreshold()}%，今日负面率 ${o.negRate >= Store.getAlertThreshold() ? '已超阈值 ⚠️ 触发红色横幅' : '低于阈值，状态良好 ✓'}

## 五、运营决策建议
1. 对【${(o.topNegativeKeywords[0] || {}).key || '服务器卡顿'}】类高频负面问题，建议产品 + QA 团队同步 24h 内输出修复方案与补偿公告。
2. 本7日咨询量较上7日增长明显，建议对${m.categoryDist.categories[0]}、${m.categoryDist.categories[2]} 两大分类补充FAQ语料，降低转人工率。
3. 针对 TapTap / 贴吧的负向高峰，建议社区运营投放 UGC 正面内容（攻略 / 二创），对冲负面情绪。`;
    document.getElementById('reportText').value = text;
    Utils.openModal('reportModal');
  };

  Dashboard.copyReport = function () {
    const txt = document.getElementById('reportText').value;
    const ok = copyText(txt);
    Utils.toast(ok ? '日报已复制到剪贴板 ✅' : '复制失败，请手动选择文本', ok ? 'success' : 'error');
  };

  function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text); return true;
      }
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch (e) { return false; }
  }

  // ============================================================
  // 总入口：首次渲染 + 对外暴露
  // ============================================================
  Dashboard.renderAll = function () {
    Dashboard.renderCS();
    Dashboard.renderOpinion();
    Dashboard.renderProduct();
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ============================================================
  // 事件绑定
  // ============================================================
  document.addEventListener('DOMContentLoaded', () => {
    // 评论筛选 & 关键词高亮
    document.getElementById('filterSentiment').addEventListener('change', e => { filterSentiment = e.target.value; renderCommentList(); });
    document.getElementById('filterPlatform').addEventListener('change', e => { filterPlatform = e.target.value; renderCommentList(); });
    let hlT;
    document.getElementById('kwHighlight').addEventListener('input', e => {
      clearTimeout(hlT); hlT = setTimeout(() => { hlKw = e.target.value; renderCommentList(); }, 150);
    });

    // 预警横幅关闭
    document.getElementById('closeAlertBtn').addEventListener('click', () => {
      document.getElementById('alertBanner').classList.remove('show');
    });

    // 阈值设置
    document.getElementById('thresholdSettingBtn').addEventListener('click', () => {
      const rng = document.getElementById('thresholdRange');
      rng.value = Store.getAlertThreshold();
      document.getElementById('thresholdValue').textContent = rng.value + '%';
      Utils.openModal('thresholdModal');
    });
    document.getElementById('thresholdRange').addEventListener('input', e => {
      document.getElementById('thresholdValue').textContent = e.target.value + '%';
    });
    document.getElementById('btnSaveThreshold').addEventListener('click', () => {
      const v = +document.getElementById('thresholdRange').value;
      Store.setAlertThreshold(v);
      Utils.closeModal('thresholdModal');
      Utils.toast('预警阈值已更新为 ' + v + '%', 'success');
      updateAlertBanner();
    });

    // 日报按钮
    document.getElementById('reportBtn').addEventListener('click', Dashboard.generateReport);
    document.getElementById('btnCopyReport').addEventListener('click', Dashboard.copyReport);

    // 主题切换时重绘图表（颜色会变）
    document.getElementById('themeToggle').addEventListener('click', () => {
      setTimeout(() => Dashboard.renderAll(), 150);
    });
  });

  global.Dashboard = Dashboard;
})(window);
