/**
 * storage.js — 本地数据层封装
 * 职责：
 *   1. 首次加载时将 window.__MOCK__（来自 mock_data.js）初始化到 localStorage
 *   2. 提供统一的 get/set/remove 接口给其他业务模块使用
 *   3. 提供数据统计工具函数（如负面率计算、情感分布汇总等）
 *
 * 设计原则：file:// 协议下不能 fetch 本地 JSON，因此所有 mock 通过全局 JS 变量注入。
 * 真实部署时只需将 initFromMock() 替换为 fetch('/api/xxx') 即可平滑迁移。
 */
(function (global) {
  'use strict';

  const PREFIX = 'game_ai_';               // localStorage 统一 key 前缀，避免冲突
  const KEYS = {
    FAQ:            PREFIX + 'faq',
    COMMENTS:       PREFIX + 'comments',
    CS_METRICS:     PREFIX + 'cs_metrics',
    OP_METRICS:     PREFIX + 'op_metrics',
    PENDING_MANUAL: PREFIX + 'pending_manual',
    SESSIONS:       PREFIX + 'chat_sessions',    // 客服会话历史
    ACTIVE_SESSION: PREFIX + 'active_session',   // 当前选中的会话 ID
    THEME:          PREFIX + 'theme',            // 'light' | 'dark'
    ALERT_THRESHOLD:PREFIX + 'alert_threshold'   // 负面预警阈值 %
  };

  // ============================================================
  // 基础 CRUD
  // ============================================================

  /** 从 localStorage 读取 JSON，失败返回默认值 def */
  function get(key, def) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? def : JSON.parse(raw);
    } catch (e) {
      console.warn('[storage] 读取失败 key=' + key, e);
      return def;
    }
  }

  /** 写入 JSON 到 localStorage */
  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('[storage] 写入失败 key=' + key, e);
      return false;
    }
  }

  function remove(key) { localStorage.removeItem(key); }

  // ============================================================
  // Mock 初始化（首次启动时执行一次）
  // ============================================================

  /** 若某 key 本地不存在，则用 __MOCK__ 的对应值初始化 */
  function initFromMock() {
    const M = global.__MOCK__ || {};
    if (!get(KEYS.FAQ, null) && M.faq)           set(KEYS.FAQ, M.faq);
    if (!get(KEYS.COMMENTS, null) && M.comments) set(KEYS.COMMENTS, M.comments);
    if (!get(KEYS.CS_METRICS, null) && M.csMetrics) set(KEYS.CS_METRICS, M.csMetrics);
    if (!get(KEYS.OP_METRICS, null) && M.opinionMetrics) set(KEYS.OP_METRICS, M.opinionMetrics);
    if (!get(KEYS.PENDING_MANUAL, null) && M.pendingManual) set(KEYS.PENDING_MANUAL, M.pendingManual);
    if (!get(KEYS.SESSIONS, null)) {
      // 创建一条示例会话，方便演示
      const sample = [{
        id: 's_' + Date.now(),
        title: '充值未到账咨询',
        status: '已解决',
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
        messages: [
          { role: 'user', text: '你好，我刚才充值648但是没到账？', time: Date.now() - 3600000 * 6 },
          { role: 'ai',   text: '请不要重复支付！请提供【区服+角色ID+订单号+支付截图】到人工客服，我们会在1小时内为您核查补发。', category: '充值问题', time: Date.now() - 3600000 * 6 + 12000 }
        ]
      }];
      set(KEYS.SESSIONS, sample);
    }
    if (!get(KEYS.ACTIVE_SESSION, null)) {
      const sessions = get(KEYS.SESSIONS, []);
      if (sessions.length) set(KEYS.ACTIVE_SESSION, sessions[0].id);
    }
    if (!get(KEYS.ALERT_THRESHOLD, null)) set(KEYS.ALERT_THRESHOLD, 30);
  }

  // ============================================================
  // 业务访问器（供其他模块调用）
  // ============================================================

  const Store = {
    KEYS,
    initFromMock,
    get, set, remove,

    // FAQ
    listFAQ()        { return get(KEYS.FAQ, []); },
    saveFAQ(list)    { return set(KEYS.FAQ, list); },
    addFAQ(item)     { const l = this.listFAQ(); item.id = Date.now(); l.push(item); return this.saveFAQ(l); },
    updateFAQ(id, patch) {
      const l = this.listFAQ();
      const idx = l.findIndex(x => x.id === id);
      if (idx >= 0) { l[idx] = Object.assign({}, l[idx], patch); this.saveFAQ(l); return true; }
      return false;
    },
    deleteFAQ(id) {
      const l = this.listFAQ().filter(x => x.id !== id);
      return this.saveFAQ(l);
    },

    // 待人工问题
    listPendingManual()  { return get(KEYS.PENDING_MANUAL, []); },
    addPendingManual(question) {
      const l = this.listPendingManual();
      l.push({ id: Date.now(), question, time: new Date().toISOString().slice(0, 19).replace('T', ' '), status: '待处理' });
      return set(KEYS.PENDING_MANUAL, l);
    },

    // 会话
    listSessions()      { return get(KEYS.SESSIONS, []); },
    saveSessions(list)  { return set(KEYS.SESSIONS, list); },
    getActiveSessionId(){ return get(KEYS.ACTIVE_SESSION, null); },
    setActiveSessionId(id){ return set(KEYS.ACTIVE_SESSION, id); },
    getActiveSession()  {
      const id = this.getActiveSessionId();
      return this.listSessions().find(s => s.id === id) || null;
    },
    createSession() {
      const list = this.listSessions();
      const s = {
        id: 's_' + Date.now(),
        title: '新会话 ' + new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        status: '进行中',
        createdAt: new Date().toISOString(),
        messages: []
      };
      list.unshift(s);
      this.saveSessions(list);
      this.setActiveSessionId(s.id);
      return s;
    },
    addMessageToActive(msg) {
      const id = this.getActiveSessionId();
      const list = this.listSessions();
      const s = list.find(x => x.id === id);
      if (!s) return null;
      s.messages.push(Object.assign({ time: Date.now() }, msg));
      // 若首条用户消息，用消息内容更新会话标题
      if (s.messages.filter(m => m.role === 'user').length === 1 && msg.role === 'user') {
        s.title = msg.text.slice(0, 14) + (msg.text.length > 14 ? '…' : '');
      }
      this.saveSessions(list);
      return s;
    },
    markActiveSessionTransferred(reason) {
      const id = this.getActiveSessionId();
      const list = this.listSessions();
      const s = list.find(x => x.id === id);
      if (!s) return null;
      s.status = '已转人工';
      s.transferReason = reason;
      s.transferredAt = new Date().toISOString();
      this.saveSessions(list);
      // 同步客服指标：转人工数 +1
      const m = this.getCSMetrics();
      m.current.totalTransfers += 1;
      m.current.transferRate = +(m.current.totalTransfers / (m.current.totalSessions || 1) * 100).toFixed(1);
      this.setCSMetrics(m);
      return s;
    },

    // 客服指标
    getCSMetrics() { return get(KEYS.CS_METRICS, {}); },
    setCSMetrics(m) { return set(KEYS.CS_METRICS, m); },

    // 舆情指标
    getOpMetrics() { return get(KEYS.OP_METRICS, {}); },
    setOpMetrics(m) { return set(KEYS.OP_METRICS, m); },

    // 评论列表
    listComments() { return get(KEYS.COMMENTS, []); },
    saveComments(list) { return set(KEYS.COMMENTS, list); },

    // 主题
    getTheme()       { return get(KEYS.THEME, 'light'); },
    setTheme(t)      { return set(KEYS.THEME, t); },

    // 预警阈值
    getAlertThreshold() { return get(KEYS.ALERT_THRESHOLD, 30); },
    setAlertThreshold(v) { return set(KEYS.ALERT_THRESHOLD, +v); }
  };

  global.Store = Store;

  // DOM Ready 后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFromMock);
  } else {
    initFromMock();
  }
})(window);
