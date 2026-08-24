/**
 * utils.js — 通用工具模块
 * 提供：Toast 提示、Modal 弹窗开关、confirm 二次确认、意图识别匹配
 */
(function (global) {
  'use strict';

  // ========= Toast =========
  let toastSeq = 0;
  function toast(text, type) {
    type = type || 'success';
    const wrap = document.getElementById('toastWrap');
    if (!wrap) return;
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.id = 'toast_' + (++toastSeq);
    el.textContent = text;
    wrap.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'all .3s';
      el.style.opacity = '0';
      el.style.transform = 'translateX(50%)';
      setTimeout(() => el.remove(), 320);
    }, 2200);
  }

  // ========= Modal =========
  function openModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('show');
  }
  function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('show');
  }
  // 绑定所有 data-close
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-close]');
    if (t) closeModal(t.getAttribute('data-close'));
    const mask = e.target.classList && e.target.classList.contains('modal-mask');
    if (mask) e.target.classList.remove('show');
  });

  // ========= 二次确认 =========
  let confirmCallback = null;
  function confirmBox(text, cb) {
    document.getElementById('confirmText').textContent = text;
    confirmCallback = cb;
    openModal('confirmModal');
  }
  document.addEventListener('DOMContentLoaded', () => {
    const okBtn = document.getElementById('btnConfirmOK');
    if (okBtn) okBtn.addEventListener('click', () => {
      closeModal('confirmModal');
      const cb = confirmCallback; confirmCallback = null;
      if (cb) cb();
    });
  });

  // ========= 意图识别：同义词 + 关键词模糊匹配 =========
  /**
   * 从 FAQ 列表中找到最匹配的一条
   * 算法：
   *   1. 将用户问题去掉空白标点，转小写
   *   2. 对每条FAQ，在问题本身 + 同义词里找最大公共子串长度 / 用户输入长度，得相似度
   *   3. 若任意关键词完全包含用户问句（或反之），大幅加分
   *   4. 相似度 >= 阈值 返回命中；否则 null（待人工）
   * @param {string} text 用户问句
   * @param {Array} faqs FAQ列表
   * @param {number} threshold 阈值 0~1，默认0.28
   * @returns {null|{faq:object, score:number}}
   */
  function matchIntent(text, faqs, threshold) {
    if (!text || !text.trim() || !faqs || !faqs.length) return null;
    threshold = threshold || 0.28;
    const q = normalize(text);
    if (!q) return null;

    let best = null;
    for (let i = 0; i < faqs.length; i++) {
      const f = faqs[i];
      const candidates = [f.q].concat(f.synonyms || []);
      let candMax = 0;
      for (let j = 0; j < candidates.length; j++) {
        const c = normalize(candidates[j]);
        if (!c) continue;
        let score = commonRatio(q, c);
        // 完全包含加分
        if (c.includes(q) || q.includes(c)) score = Math.max(score, 0.85);
        // 关键词交叉：用户词 & FAQ问题词 交集数
        const qWords = splitWords(q);
        const cWords = splitWords(c);
        const inter = qWords.filter(w => cWords.some(x => x.includes(w) || w.includes(x)));
        if (inter.length) score = Math.max(score, Math.min(0.95, inter.length * 0.22));
        if (score > candMax) candMax = score;
      }
      if (!best || candMax > best.score) best = { faq: f, score: candMax };
    }
    return best && best.score >= threshold ? best : null;
  }

  function normalize(s) {
    return (s || '').trim()
      .replace(/[\s\p{P}\p{S}]/gu, '')
      .toLowerCase();
  }
  function splitWords(s) {
    // 简单分词：连续字母数字做token，其余按1字切（中文轻量分词）
    const out = [];
    let cur = '';
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (/[a-z0-9]/i.test(c)) cur += c;
      else {
        if (cur) { out.push(cur); cur = ''; }
        if (c) out.push(c);
      }
    }
    if (cur) out.push(cur);
    // 加上2-gram（中文）以加强匹配
    const grams = [];
    for (let i = 0; i < s.length - 1; i++) {
      const g = s.slice(i, i + 2);
      if (/[\u4e00-\u9fa5]/.test(g)) grams.push(g);
    }
    return Array.from(new Set(out.concat(grams))).filter(x => x.length >= 1);
  }
  // 最长公共子序列长度 / max(lenA, lenB)
  function commonRatio(a, b) {
    if (!a || !b) return 0;
    const n = a.length, m = b.length;
    const total = Math.max(n, m);
    if (!total) return 0;
    // 用短串当列
    if (n < m) { const t = a; a = b; b = t; }
    const dp = new Array(b.length + 1).fill(0);
    let max = 0;
    for (let i = 1; i <= a.length; i++) {
      let prev = 0;
      for (let j = 1; j <= b.length; j++) {
        const tmp = dp[j];
        if (a[i - 1] === b[j - 1]) { dp[j] = prev + 1; if (dp[j] > max) max = dp[j]; }
        else dp[j] = 0;
        prev = tmp;
      }
    }
    return max / total;
  }

  // ========= 主题切换 =========
  function initTheme() {
    const saved = (typeof Store !== 'undefined' && Store.getTheme) ? Store.getTheme() : 'light';
    applyTheme(saved);
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      if (typeof Store !== 'undefined' && Store.setTheme) Store.setTheme(next);
    });
  }
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    const sun = document.getElementById('iconSun');
    const moon = document.getElementById('iconMoon');
    if (sun && moon) {
      if (t === 'dark') { sun.style.display = ''; moon.style.display = 'none'; }
      else { sun.style.display = 'none'; moon.style.display = ''; }
    }
  }

  // ========= Tab 切换（主 + 子） =========
  function initTabs() {
    const navItems = document.querySelectorAll('.nav-item[data-tab]');
    const panes = document.querySelectorAll('.tab-pane[data-pane]');
    const titleMap = {
      chat: ['AI智能客服', '核心模块 / 智能客服 · 7×24小时在线'],
      dashboard: ['数据看板', '业务能力 / 客服 + 舆情 + 产品分析'],
      knowledge: ['知识库管理', '业务能力 / FAQ 意图识别语料管理'],
      workflow: ['AI工作流', '业务能力 / 舆情情报自动化管线']
    };
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        const target = item.getAttribute('data-tab');
        panes.forEach(p => p.classList.toggle('active', p.getAttribute('data-pane') === target));
        if (titleMap[target]) {
          document.getElementById('pageTitle').textContent = titleMap[target][0];
          document.getElementById('pageBreadcrumb').textContent = titleMap[target][1];
        }
        // 进入舆情Tab时，触发图表刷新（Chart.js画布首次显示才能正确测量）
        if (target === 'dashboard' && typeof Dashboard !== 'undefined' && Dashboard.renderAll) {
          setTimeout(() => Dashboard.renderAll(), 50);
        }
      });
    });

    // 子Tab
    const subs = document.querySelectorAll('.sub-tab[data-sub]');
    const subpanes = document.querySelectorAll('.sub-pane[data-subpane]');
    subs.forEach(s => {
      s.addEventListener('click', () => {
        subs.forEach(x => x.classList.remove('active'));
        s.classList.add('active');
        const t = s.getAttribute('data-sub');
        subpanes.forEach(p => p.classList.toggle('active', p.getAttribute('data-subpane') === t));
        if (typeof Dashboard !== 'undefined' && Dashboard.renderAll) setTimeout(() => Dashboard.renderAll(), 50);
      });
    });
  }

  // ========= 导出 =========
  global.Utils = {
    toast, openModal, closeModal, confirmBox,
    matchIntent, normalize, splitWords, commonRatio,
    initTheme, applyTheme, initTabs
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { Utils.initTheme(); Utils.initTabs(); });
  } else {
    Utils.initTheme(); Utils.initTabs();
  }
})(window);
