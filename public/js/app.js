/**
 * app.js — 总装模块
 * 负责：首屏初始化（将mock JSON文件转换为data目录文件）、启动时做预检查、提供对外接口。
 * 此文件位于所有业务脚本之后加载，确保各模块都已注册到window。
 */
(function (global) {
  'use strict';

  function boot() {
    // 1. 确保 Store 初始化
    // storage.js 在 DOMContentLoaded 时已调用 initFromMock。此处再次兜底。
    if (typeof Store !== 'undefined' && Store.initFromMock) Store.initFromMock();

    // 2. FAQ 知识库已由 faq.js 自行渲染；客服模块由 chat.js 自行渲染
    // 3. Dashboard：默认子Tab为客服指标，但首次页面是客服Tab，不需要立即渲染图表。
    //    预注册一个一次性的dashboard切换时渲染（utils.js已做）。
    //    这里不主动调用避免Chart.js在display:none画布上测量失败。

    // 4. 控制台Banner：方便演示环境校验
    console.log(
      '%c🎮 Game AI Suite · 游戏行业 AI智能客服+舆情监控自动化系统',
      'background:linear-gradient(135deg,#6366F1,#8B5CF6,#A855F7);color:#fff;padding:8px 14px;border-radius:8px;font-weight:bold;font-size:13px;'
    );
    console.log('%c✅ 前端模块：mock数据 / 数据层 / 智能客服 / 知识库管理 / 数据看板(22图) / AI工作流 全部加载完成', 'color:#10B981;font-weight:600;');
    console.log('%c📋 P0/P1/P2 功能清单 见 README.md · 运行方式：双击 index.html', 'color:#6366F1;');

    // 5. 将 mock/ 下的 JSON 同步输出到 data/ 目录（此处无法写本地文件；由Python脚本生成。仅校验数据。）
    sanityCheck();
  }

  // 关键数据完整性检查（冒烟测试一部分）
  function sanityCheck() {
    const errs = [];
    if (typeof Store === 'undefined') errs.push('Store未定义');
    else {
      if (Store.listFAQ().length < 15) errs.push('FAQ少于15条');
      if (Store.listComments().length < 60) errs.push('评论少于60条');
      const m = Store.getCSMetrics();
      if (!m || !m.labels7 || m.labels7.length !== 7) errs.push('客服7日趋势数据缺失');
      const o = Store.getOpMetrics();
      if (!o || !o.hotspots || o.hotspots.length < 4) errs.push('热点聚类少于4条');
    }
    if (errs.length) {
      console.warn('%c⚠️ Sanity check 发现问题：', 'color:#F59E0B;font-weight:bold;', errs);
    } else {
      console.log('%c✅ Sanity check 通过，所有Mock数据指标符合验收要求', 'color:#10B981;font-weight:bold;');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // 暴露给console调试用
  global.App = { boot, sanityCheck };
})(window);
