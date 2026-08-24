/**
 * chat.js — 智能客服模块
 * 负责：会话列表渲染、消息气泡渲染、输入发送、意图识别、待人工标记、转人工标记
 * 依赖：window.Store (storage.js)、window.Utils (utils.js)
 */
(function (global) {
  'use strict';

  const Chat = {};

  // ========= 渲染：会话列表 =========
  Chat.renderSessionList = function () {
    const list = Store.listSessions();
    const activeId = Store.getActiveSessionId();
    const el = document.getElementById('sessionList');
    if (!el) return;
    el.innerHTML = list.map(s => {
      const count = (s.messages || []).filter(m => m.role === 'user').length;
      const statusBadge = s.status === '已转人工'
        ? '<span class="badge badge-red">转人工</span>'
        : s.status === '已解决'
          ? '<span class="badge badge-green">已解决</span>'
          : '<span class="badge badge-yellow">进行中</span>';
      return `<div class="session-item ${s.id === activeId ? 'active' : ''}" data-sid="${s.id}">
        <div class="session-title">${escapeHtml(s.title)}</div>
        <div class="session-meta">
          <span>${count} 条消息</span>${statusBadge}
        </div>
      </div>`;
    }).join('') || `<div style="padding:24px;text-align:center;color:var(--text-3);font-size:12px;">暂无会话</div>`;

    el.querySelectorAll('.session-item').forEach(it => {
      it.addEventListener('click', () => {
        Store.setActiveSessionId(it.getAttribute('data-sid'));
        Chat.renderSessionList();
        Chat.renderActive();
      });
    });
  };

  // ========= 渲染：当前会话消息 =========
  Chat.renderActive = function () {
    const s = Store.getActiveSession();
    if (!s) {
      // 若没有会话则新建
      Store.createSession();
      return Chat.renderActive();
    }
    document.getElementById('chatTitle').textContent = s.title;
    const statusBadge = document.getElementById('statusBadge');
    if (s.status === '已转人工') statusBadge.className = 'badge badge-red';
    else if (s.status === '已解决') statusBadge.className = 'badge badge-green';
    else statusBadge.className = 'badge badge-green';
    statusBadge.textContent = s.status === '已转人工' ? '● 已转人工处理'
      : s.status === '已解决' ? '● 会话已解决' : '● 在线 AI 客服';

    const box = document.getElementById('chatMessages');
    if (!s.messages || !s.messages.length) {
      box.innerHTML = `<div class="msg-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <div>您好！我是《星陨纪》AI 客服助手</div>
        <div style="margin-top:4px;font-size:12px;">请点击下方快捷问题，或直接输入您的问题。</div>
      </div>`;
      return;
    }
    box.innerHTML = s.messages.map(m => renderMessage(m, s)).join('');
    box.scrollTop = box.scrollHeight;
  };

  function renderMessage(m, session) {
    if (m.role === 'user') {
      return `<div class="msg user">
        <div class="msg-avatar">我</div>
        <div>
          <div class="msg-bubble">${escapeHtml(m.text)}</div>
          <div class="msg-meta">${fmtTime(m.time)}</div>
        </div>
      </div>`;
    }
    // AI 消息
    const catTag = m.category ? `<span class="badge badge-purple">📌 ${escapeHtml(m.category)}</span>` : '';
    const pendingTag = m.pendingManual ? '<span class="badge badge-red">⚠️ 已标记人工</span>' : '';
    const transferBtn = session.status !== '已转人工'
      ? `<button class="btn btn-secondary btn-sm" data-action="transfer" title="标记转人工">↗️ 转人工</button>`
      : '';
    return `<div class="msg ai">
      <div class="msg-avatar">AI</div>
      <div style="max-width:100%;">
        <div class="msg-bubble">${escapeHtml(m.text)}</div>
        <div class="msg-meta">
          ${catTag}${pendingTag}<span style="margin-left:auto;">${fmtTime(m.time)}</span>
        </div>
        <div class="msg-actions">${transferBtn}</div>
      </div>
    </div>`;
  }

  // ========= 发送消息 =========
  Chat.sendMessage = function (text) {
    text = (text || '').trim();
    if (!text) return;
    // 若无活动会话则新建
    if (!Store.getActiveSession()) Store.createSession();
    // 1. 写入用户消息
    Store.addMessageToActive({ role: 'user', text });
    Chat.renderActive();
    Chat.renderSessionList();

    const input = document.getElementById('chatInput');
    if (input) input.value = '';
    autoResizeTextarea(input);

    // 2. 模拟AI响应（延时80-200ms体现真实感）
    const delay = 80 + Math.random() * 120;
    setTimeout(() => {
      const faqs = Store.listFAQ();
      const match = Utils.matchIntent(text, faqs, 0.25);
      let reply, category, pendingManual = false;
      if (match) {
        reply = match.faq.a;
        category = match.faq.category;
      } else {
        reply = '抱歉，小助手暂时未能识别您的问题。已为您自动标记为【待人工处理】，人工客服会在30分钟内联系您，请保持账号在线。\n\n您也可以补充说明具体场景：'
          + '\n· 充值问题 → 请提供【区服+角色ID+订单号】'
          + '\n· Bug问题 → 请描述【操作步骤+设备型号+截图】';
        pendingManual = true;
        Store.addPendingManual(text);
        Chat.renderPendingList();
      }
      // 2. 构造AI回复并写入会话（直接操作sessions避免重复写）
      const sessions = Store.listSessions();
      const sid = Store.getActiveSessionId();
      const s = sessions.find(x => x.id === sid);
      if (s) {
        s.messages.push({
          role: 'ai',
          text: reply,
          category: category,
          pendingManual: pendingManual,
          time: Date.now()
        });
        Store.saveSessions(sessions);
      }
      Chat.renderActive();
      Chat.renderSessionList();
      if (pendingManual) Utils.toast('已加入待人工处理队列', 'warn');
    }, delay);
  };

  // ========= 渲染：待人工列表 =========
  Chat.renderPendingList = function () {
    const list = Store.listPendingManual();
    const count = list.length;
    const badgeEl = document.getElementById('pendingCount');
    if (badgeEl) badgeEl.textContent = count;
    const badge2 = document.getElementById('pendingBadge');
    if (badge2) badge2.textContent = count + ' 条';
    const el = document.getElementById('pendingList');
    if (!el) return;
    el.innerHTML = list.slice(0, 30).map(p => `
      <div style="padding:10px 12px;background:var(--bg-input);border-radius:10px;border:1px solid var(--border);">
        <div style="font-size:12px;color:var(--text-1);line-height:1.6;">${escapeHtml(p.question)}</div>
        <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:11px;color:var(--text-3);">
          <span>${escapeHtml(p.time)}</span>
          <span class="badge badge-yellow">${escapeHtml(p.status || '待处理')}</span>
        </div>
      </div>
    `).join('') || `<div style="padding:20px;text-align:center;font-size:12px;color:var(--text-3);">🎉 暂无待人工问题</div>`;
  };

  // ========= 转人工 =========
  Chat.openTransfer = function () {
    document.getElementById('transferReason').value = 'AI无法解答';
    document.getElementById('transferNote').value = '';
    Utils.openModal('transferModal');
  };

  Chat.confirmTransfer = function () {
    const reason = document.getElementById('transferReason').value;
    const note = document.getElementById('transferNote').value || '';
    Store.markActiveSessionTransferred(reason + (note ? ' · ' + note : ''));
    Utils.closeModal('transferModal');
    Utils.toast('已转人工处理，Dashboard 指标同步更新', 'success');
    Chat.renderSessionList();
    Chat.renderActive();
    // 同步更新转人工KPI
    const m = Store.getCSMetrics();
    const tr = document.getElementById('kpiTransfer');
    if (tr) tr.innerHTML = m.current.transferRate.toFixed(1) + '<span class="unit">%</span>';
  };

  // ========= 辅助 =========
  function fmtTime(t) {
    try {
      const d = new Date(t);
      return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return ''; }
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function autoResizeTextarea(el) {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  }

  // ========= 事件绑定 =========
  document.addEventListener('DOMContentLoaded', () => {
    // 渲染
    Chat.renderSessionList();
    Chat.renderActive();
    Chat.renderPendingList();

    // 发送按钮
    document.getElementById('sendBtn').addEventListener('click', () => {
      Chat.sendMessage(document.getElementById('chatInput').value);
    });
    const input = document.getElementById('chatInput');
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        Chat.sendMessage(input.value);
      }
    });
    input.addEventListener('input', () => autoResizeTextarea(input));
    autoResizeTextarea(input);

    // 快捷问题
    document.querySelectorAll('.qq-btn').forEach(b => {
      b.addEventListener('click', () => Chat.sendMessage(b.getAttribute('data-q')));
    });

    // 新建会话
    document.getElementById('newSessionBtn').addEventListener('click', () => {
      Store.createSession();
      Chat.renderSessionList();
      Chat.renderActive();
      Utils.toast('已创建新会话', 'success');
    });

    // 待人工按钮
    document.getElementById('viewPendingBtn').addEventListener('click', () => {
      document.querySelector('[data-tab="knowledge"]').click();
      Utils.toast('待人工问题显示在客服右侧面板', 'info');
    });

    // 转人工按钮（事件委托）
    document.getElementById('chatMessages').addEventListener('click', e => {
      if (e.target.matches('[data-action="transfer"]') || e.target.closest('[data-action="transfer"]')) {
        Chat.openTransfer();
      }
    });
    document.getElementById('btnConfirmTransfer').addEventListener('click', Chat.confirmTransfer);
  });

  global.Chat = Chat;
})(window);
