/**
 * faq.js — FAQ 知识库管理（增删改查 + 搜索）
 * 依赖：Store、Utils
 */
(function (global) {
  'use strict';
  const FAQ = {};
  let editingId = null;
  let searchKey = '';

  FAQ.render = function () {
    let list = Store.listFAQ();
    if (searchKey) {
      const k = searchKey.toLowerCase();
      list = list.filter(f =>
        f.q.toLowerCase().includes(k) ||
        f.a.toLowerCase().includes(k) ||
        (f.category || '').toLowerCase().includes(k) ||
        (f.synonyms || []).some(s => s.toLowerCase().includes(k))
      );
    }
    document.getElementById('faqCount').textContent = list.length;
    const cats = new Set(Store.listFAQ().map(f => f.category));
    document.getElementById('faqCatCount').textContent = cats.size;

    const body = document.getElementById('faqTableBody');
    body.innerHTML = list.map(f => `
      <tr>
        <td><span class="badge badge-gray">#${f.id}</span></td>
        <td>
          <div style="font-weight:600;color:var(--text-1);">${esc(f.q)}</div>
          <div style="margin-top:4px;font-size:11px;color:var(--text-3);">
            同义词：${(f.synonyms && f.synonyms.length) ? f.synonyms.map(s => `<span class="chip">${esc(s)}</span>`).join('') : '<span style="color:var(--text-3);">无</span>'}
          </div>
        </td>
        <td style="line-height:1.7;">${esc(f.a).length > 120 ? esc(f.a).slice(0, 120) + '…' : esc(f.a)}</td>
        <td><span class="badge badge-${catColor(f.category)}">${esc(f.category || '其他')}</span></td>
        <td>
          <div class="table-actions">
            <button class="btn btn-secondary btn-sm" data-edit="${f.id}">✏️ 编辑</button>
            <button class="btn btn-danger btn-sm" data-del="${f.id}">🗑 删除</button>
          </div>
        </td>
      </tr>
    `).join('') || `<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-3);">暂无匹配的FAQ条目</td></tr>`;

    // 事件委托
    body.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => FAQ.openEdit(+b.getAttribute('data-edit'))));
    body.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => FAQ.askDelete(+b.getAttribute('data-del'))));
  };

  FAQ.openAdd = function () {
    editingId = null;
    document.getElementById('faqModalTitle').textContent = '新增 FAQ';
    document.getElementById('faqInputQ').value = '';
    document.getElementById('faqInputA').value = '';
    document.getElementById('faqInputCat').value = '游戏玩法';
    document.getElementById('faqInputSyn').value = '';
    Utils.openModal('faqModal');
    setTimeout(() => document.getElementById('faqInputQ').focus(), 100);
  };

  FAQ.openEdit = function (id) {
    const f = Store.listFAQ().find(x => x.id === id);
    if (!f) return;
    editingId = id;
    document.getElementById('faqModalTitle').textContent = '编辑 FAQ #' + id;
    document.getElementById('faqInputQ').value = f.q;
    document.getElementById('faqInputA').value = f.a;
    document.getElementById('faqInputCat').value = f.category || '其他';
    document.getElementById('faqInputSyn').value = (f.synonyms || []).join('，');
    Utils.openModal('faqModal');
  };

  FAQ.save = function () {
    const q = document.getElementById('faqInputQ').value.trim();
    const a = document.getElementById('faqInputA').value.trim();
    const category = document.getElementById('faqInputCat').value;
    const synRaw = document.getElementById('faqInputSyn').value.trim();
    const synonyms = synRaw ? synRaw.split(/[,，、]/).map(s => s.trim()).filter(Boolean) : [];
    if (!q || !a) { Utils.toast('问题和答案均不能为空', 'error'); return; }
    if (editingId) {
      Store.updateFAQ(editingId, { q, a, category, synonyms });
      Utils.toast('FAQ 已更新', 'success');
    } else {
      Store.addFAQ({ q, a, category, synonyms });
      Utils.toast('FAQ 已添加', 'success');
    }
    Utils.closeModal('faqModal');
    FAQ.render();
  };

  FAQ.askDelete = function (id) {
    const f = Store.listFAQ().find(x => x.id === id);
    if (!f) return;
    Utils.confirmBox(`确定要删除 FAQ #${id}「${f.q}」吗？此操作不可撤销。`, () => {
      Store.deleteFAQ(id);
      Utils.toast('FAQ 已删除', 'success');
      FAQ.render();
    });
  };

  function catColor(c) {
    return ({ '账号问题': 'blue', '充值问题': 'yellow', '游戏玩法': 'purple', 'Bug反馈': 'red', '建议投诉': 'green' })[c] || 'gray';
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // 搜索延迟，避免输入时频繁刷新
  let searchTimer = null;

  document.addEventListener('DOMContentLoaded', () => {
    FAQ.render();
    document.getElementById('btnAddFAQ').addEventListener('click', FAQ.openAdd);
    document.getElementById('btnSaveFAQ').addEventListener('click', FAQ.save);
    document.getElementById('faqSearch').addEventListener('input', e => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => { searchKey = e.target.value; FAQ.render(); }, 150);
    });
  });

  global.FAQ = FAQ;
})(window);
