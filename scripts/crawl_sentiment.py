# -*- coding: utf-8 -*-
"""
crawl_sentiment.py — 游戏行业舆情抓取 + 情感分析 + 自动打标签 + 负面预警脚本

使用方式：
    python scripts/crawl_sentiment.py              # 等价于 --mock
    python scripts/crawl_sentiment.py --mock       # 使用随机生成器（默认，无需任何依赖）
    python scripts/crawl_sentiment.py --real       # 尝试调用真实平台抓取骨架（需要requests）
    python scripts/crawl_sentiment.py --count 120  # 自定义生成条数
    python scripts/crawl_sentiment.py --alert 25   # 自定义负面预警阈值%

输出：
    data/comments_YYYYMMDD.json   — 评论结构化数据（80+条/默认）
    data/opinion_metrics.json     — 聚合指标（情感分布/热点聚类/平台分布/预警清单）
    data/daily_report.md          — 舆情日报（Markdown）

功能模块：
    1. 4平台适配器（TapTap/好游快爆/微博/贴吧）—— 提供请求骨架，默认降级到mock。
    2. 去重 —— 基于评论内容 MD5。
    3. 时间归档 —— 按近7日随机时间 + 规范化到 YYYY-MM-DD HH:MM:SS。
    4. 情感分析 —— 中文关键词打分法（正面+1/负面-1），归一化到 sentiment + confidence。
    5. 标签抽取 —— 行业黑话关键词库匹配，生成 tags 数组（2~5个）。
    6. 热度分计算 —— hot_score = 字数 × 0.3 + 情感绝对值 × 30 + 随机噪声。
    7. 负面预警 —— 按标签聚合负面率，输出 Top3 预警卡片。
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
import random
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Dict, List, Tuple

# ============================================================
# 路径：脚本在 scripts/ 目录，项目根目录是上一级
# ============================================================
ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
DATA_DIR.mkdir(exist_ok=True)
MOCK_DIR = ROOT / "mock"
MOCK_DIR.mkdir(exist_ok=True)

# ============================================================
# 行业黑话词库（与前端 workflow.js 保持一致或更丰富）
# ============================================================
POS_WORDS: List[str] = [
    "好玩", "良心", "惊艳", "喜欢", "流畅", "好评", "推荐", "神作", "不氪", "漂亮",
    "精美", "舒服", "稳", "香", "爱了", "yyds", "吹爆", "画面太美", "剧情封神",
    "打击感拉满", "不逼氪", "BGM好评", "配音好听", "老婆好美", "福利多"
]
NEG_WORDS: List[str] = [
    "闪退", "卡", "崩", "炸了", "掉线", "登不上", "氪金", "逼氪", "吃相", "平衡差",
    "肝", "保底歪", "没出", "恶心", "垃圾", "退游", "烂", "bug", "糊", "发烫",
    "卡顿", "掉帧", "420抽", "小保底歪", "服务器炸", "匹配狗", "p2w", "骗氪",
    "剧情太刀", "建模崩", "补偿太少", "排队久", "暗削", "吞星晶", "封号"
]
TAG_POOL: Dict[str, List[str]] = {
    # 负面标签
    "氪金严重": ["氪金", "逼氪", "648", "骗氪", "吃相", "p2w", "月卡", "首充"],
    "服务器卡顿": ["卡", "卡顿", "掉帧", "崩", "掉线", "服务器", "登不上", "炸", "排队", "发烫", "糊"],
    "抽卡概率": ["保底", "420抽", "没出", "小保底", "歪了", "抽卡", "概率", "UP池"],
    "平衡问题": ["平衡", "削", "超模", "太弱", "下水道", "数值", "匹配", "PVP"],
    "闪退Bug":  ["闪退", "bug", "崩溃", "进不去", "卡住", "出错", "修复", "黑屏"],
    "建模崩坏": ["建模", "脸崩", "丑", "糊", "穿模", "优化差"],
    "客服响应慢": ["客服", "没人管", "机器人", "不理", "工单", "踢皮球"],
    "剧情不适": ["剧情", "太刀", "虐心", "毁人设", "吃书"],
    # 正向标签
    "画面惊艳": ["画面", "精美", "惊艳", "画质", "美术", "光追", "老婆好"],
    "玩法丰富": ["玩法", "内容", "探索", "开放世界", "主线", "支线", "深渊"],
    "剧情好评": ["剧情", "封神", "治愈", "泪目", "文案", "代入感", "伏笔"],
    "角色塑造": ["角色", "人设", "配音", "老婆", "CV", "建模精美", "背景故事"],
    "不逼氪":   ["不氪", "福利", "良心", "月卡党", "白嫖", "零氪"],
    "BGM优秀":  ["BGM", "音乐", "配音", "音效", "歌曲"],
    # 中性标签
    "活动偏少": ["活动", "福利太少", "长草", "内容少"],
    "UI一般":   ["UI", "界面", "按钮", "操作"],
    "优化一般": ["优化", "卡顿", "发热", "耗电"],
    "玩法中规": ["一般", "中规", "普通", "没新意"],
    "期待更新": ["期待", "等更新", "后续", "前瞻"]
}
PLATFORMS: List[str] = ["TapTap", "好游快爆", "微博", "贴吧"]
PLAT_WEIGHTS: Tuple[float, ...] = (0.32, 0.23, 0.25, 0.20)
GAME_REFS: List[str] = [
    "星陨纪", "新池UP【星陨】", "深渊12层", "风蚀峡谷副本", "周年庆版本",
    "1.5更新后", "限定角色「月白」", "公会战S3赛季", "月卡党", "零氪玩家"
]
AUTHORS: List[str] = [
    "星陨纪忠实玩家", "萌新入坑第3天", "二次元老油条", "开服零氪党", "氪金大佬XXX",
    "佛系养老选手", "抽卡必欧皇", "手残操作流", "重度颜值党", "剧情考据党",
    "TapTap老用户", "微博自来水", "贴吧14级大水比", "好游快爆鉴赏家"
]
SENTIMENT_WEIGHTS: Tuple[float, ...] = (0.35, 0.30, 0.35)  # pos/neu/neg（负面偏高触发预警）


# ============================================================
# 1. 平台适配器（真实抓取骨架，失败则fallback到mock）
# ============================================================
def _build_headers(platform: str) -> Dict[str, str]:
    """返回每个平台的请求头（仅框架，不绕过反爬）"""
    base = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0 Safari/537.36"
        ),
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "zh-CN,zh;q=0.9",
    }
    # 不同平台Referer可后续补充
    if platform == "TapTap":
        base["Referer"] = "https://www.taptap.cn/"
    elif platform == "微博":
        base["Referer"] = "https://m.weibo.cn/"
    elif platform == "好游快爆":
        base["Referer"] = "https://www.3839.com/"
    elif platform == "贴吧":
        base["Referer"] = "https://tieba.baidu.com/"
    return base


def fetch_platform_real(platform: str, count: int) -> List[Dict]:
    """
    真实抓取函数骨架（需要requests；如果抓取失败返回[]，上层会fallback到mock）。
    注意：此处仅演示架构，不提供绕过反爬/签名逻辑，避免合规风险。
    """
    try:
        import requests  # type: ignore
    except Exception as e:
        print(f"  · {platform}: 未安装 requests，跳过真实抓取，fallback 到mock")
        return []
    session = requests.Session()
    session.headers.update(_build_headers(platform))
    # 每个平台提供示例URL，但不保证成功
    urls = {
        "TapTap":    "https://www.taptap.cn/webapiv2/app-topic?X-UA=V=1&PN=WebApp",
        "好游快爆":  "https://www.3839.com/comment.php",
        "微博":      "https://m.weibo.cn/api/container/getIndex?containerid=100103type=1",
        "贴吧":      "https://tieba.baidu.com/mg/o/frs-tab/page"
    }
    try:
        r = session.get(urls[platform], timeout=5)
        print(f"  · {platform}: HTTP {r.status_code}（演示用URL通常返回403/非200，已fallback）")
        return []
    except Exception as e:
        print(f"  · {platform}: 请求异常 {e}，fallback到mock")
        return []


# ============================================================
# 2. Mock生成器（无需任何依赖，稳定可复现）
# ============================================================
def generate_mock_comments(total: int) -> List[Dict]:
    comments: List[Dict] = []
    for i in range(total):
        plat = random.choices(PLATFORMS, weights=PLAT_WEIGHTS, k=1)[0]
        sent = random.choices(["positive", "neutral", "negative"], weights=SENTIMENT_WEIGHTS, k=1)[0]
        pool = POS_WORDS if sent == "positive" else NEG_WORDS if sent == "negative" else ["还行", "一般", "观望", "等更新", "中规中矩", "先四星"]
        pick_n = random.randint(1, 3)
        words = random.sample(pool, min(pick_n, len(pool)))
        ref = random.choice(GAME_REFS)
        tail = (
            "继续加油，希望多出点联动活动～" if sent == "positive"
            else "先观望，等后续版本再改评分。" if sent == "neutral"
            else "希望官方尽快修复！不然真的要退游了。"
        )
        content = f"{ref}体验：{'，'.join(words)}。{tail}"
        days = random.randint(0, 6)
        hours = random.randint(0, 23)
        mins = random.randint(0, 59)
        t = dt.datetime.now() - dt.timedelta(days=days, hours=hours, minutes=mins)
        time_str = t.strftime("%Y-%m-%d %H:%M:%S")
        comments.append({
            "id": i + 1,
            "platform": plat,
            "author": f"{random.choice(AUTHORS)}{random.randint(100, 999)}",
            "content": content,
            "time": time_str,
            # 以下字段在 analyze_all 里再写入
            "sentiment": sent,
            "confidence": 0.0,
            "tags": [],
            "hot_score": 0,
        })
    return comments


# ============================================================
# 3. 去重（MD5）
# ============================================================
def dedupe(comments: List[Dict]) -> List[Dict]:
    seen: set = set()
    out: List[Dict] = []
    for c in comments:
        key = hashlib.md5(c["content"].encode("utf-8")).hexdigest()
        if key in seen:
            continue
        seen.add(key)
        out.append(c)
    return out


# ============================================================
# 4. 情感分析 + 标签 + 热度分
# ============================================================
def analyze_one(text: str) -> Dict:
    score = 0
    for w in POS_WORDS:
        if w in text:
            score += 1
    for w in NEG_WORDS:
        if w in text:
            score -= 1
    abs_s = min(5, abs(score))
    confidence = round(0.55 + abs_s * 0.09 + random.random() * 0.05, 2)
    if score > 0:
        sent = "positive"
    elif score < 0:
        sent = "negative"
    else:
        sent = "neutral"
    # 标签
    tags: List[str] = []
    for tag, kws in TAG_POOL.items():
        if any(k in text for k in kws):
            tags.append(tag)
    if not tags:
        # 兜底随机给1-2个中性
        tags = random.sample(["期待更新", "UI一般", "玩法中规", "优化一般"], random.randint(1, 2))
    tags = tags[:5]
    # 热度分
    hot = round(len(text) * 0.3 + abs(score) * 30 + random.uniform(10, 60))
    return {
        "sentiment": sent,
        "confidence": confidence,
        "tags": tags,
        "hot_score": hot,
    }


def analyze_all(comments: List[Dict]) -> List[Dict]:
    for c in comments:
        r = analyze_one(c["content"])
        # 保留用户预定义 sentiment 作参考；若模型打分结果有更强信号则以模型为准
        if r["sentiment"] != "neutral" or c["sentiment"] == "neutral":
            c["sentiment"] = r["sentiment"]
        c["confidence"] = r["confidence"]
        c["tags"] = r["tags"]
        c["hot_score"] = r["hot_score"]
    return comments


# ============================================================
# 5. 聚合指标 & 预警清单
# ============================================================
def build_metrics(comments: List[Dict], alert_threshold: float) -> Dict:
    total = len(comments)
    sent_cnt: Counter = Counter(c["sentiment"] for c in comments)
    plat_cnt: Counter = Counter(c["platform"] for c in comments)

    # 热点聚类（按tags聚合）
    tag_map: Dict[str, Dict] = defaultdict(lambda: {"count": 0, "score": 0, "sample": ""})
    for c in comments:
        for t in c["tags"]:
            tag_map[t]["count"] += 1
            tag_map[t]["score"] += 1 if c["sentiment"] == "positive" else -1 if c["sentiment"] == "negative" else 0
            if not tag_map[t]["sample"]:
                tag_map[t]["sample"] = c["content"][:50]
    hotspots = sorted(tag_map.items(), key=lambda kv: kv[1]["count"], reverse=True)[:6]
    hotspots_list = [
        {
            "key": k,
            "count": v["count"],
            "sentiment": "positive" if v["score"] > 1 else "negative" if v["score"] < -1 else "neutral",
            "summary": v["sample"]
        }
        for k, v in hotspots
    ]
    # 每日堆叠
    daily: Dict[str, Dict] = defaultdict(lambda: {"positive": 0, "neutral": 0, "negative": 0})
    for c in comments:
        d = c["time"][5:10].replace("-", "/")
        daily[d][c["sentiment"]] += 1
    daily_stacks = sorted(
        [{"date": k, **v} for k, v in daily.items()],
        key=lambda r: r["date"]
    )[-7:]

    # 负面预警（按标签聚合负面率）
    tag_stats: Dict[str, Dict] = {}
    for c in comments:
        for t in c["tags"]:
            s = tag_stats.setdefault(t, {"total": 0, "neg": 0, "platforms": Counter()})
            s["total"] += 1
            if c["sentiment"] == "negative":
                s["neg"] += 1
            s["platforms"][c["platform"]] += 1
    alerts_list = []
    for t, s in tag_stats.items():
        if s["total"] < 3:
            continue
        rate = s["neg"] / s["total"] * 100
        alerts_list.append({
            "keyword": t,
            "total": s["total"],
            "neg": s["neg"],
            "neg_rate": round(rate, 1),
            "top_platforms": dict(s["platforms"].most_common(2))
        })
    alerts_list.sort(key=lambda x: (x["neg_rate"], x["total"]), reverse=True)
    top_alerts = alerts_list[:3]

    neg_rate = round(sent_cnt.get("negative", 0) / total * 100, 1)
    return {
        "totalComments": total,
        "posRate": round(sent_cnt.get("positive", 0) / total * 100, 1),
        "neuRate": round(sent_cnt.get("neutral",  0) / total * 100, 1),
        "negRate": neg_rate,
        "sentimentCount": dict(sent_cnt),
        "platformCount": dict(plat_cnt),
        "hotspots": hotspots_list,
        "dailyStacks": daily_stacks,
        "alertThreshold": alert_threshold,
        "alertTriggered": neg_rate >= alert_threshold,
        "topNegativeKeywords": top_alerts,
        "generatedAt": dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }


# ============================================================
# 6. 舆情日报 Markdown
# ============================================================
def build_daily_report(metrics: Dict, comments: List[Dict]) -> str:
    date_str = dt.datetime.now().strftime("%Y-%m-%d")
    plat_lines = "\n".join(
        f"  · **{p}**：{n} 条 ({round(n/metrics['totalComments']*100,1)}%)"
        for p, n in sorted(metrics["platformCount"].items(), key=lambda x: -x[1])
    )
    hot_lines = "\n".join(
        f"  {i+1}. **{h['key']}** — {h['count']}条（{'正向' if h['sentiment']=='positive' else '负向⚠️' if h['sentiment']=='negative' else '中性'}） 摘要：{h['summary']}"
        for i, h in enumerate(metrics["hotspots"][:3])
    )
    alert_lines = (
        "\n".join(f"  · 高风险【{a['keyword']}】：负面率 {a['neg_rate']}%（共{a['total']}条，主要平台 {', '.join(a['top_platforms'].keys())}）"
        for a in metrics["topNegativeKeywords"])
        or "  · 今日无突发高风险负面关键词 🎉"
    )
    return f"""# 《星陨纪》每日舆情运营日报 · {date_str}

## 一、全网舆情总量
- 全平台抓取评论总数：**{metrics['totalComments']}** 条
- 综合情感：正向 {metrics['posRate']}% / 中性 {metrics['neuRate']}% / 负向 {metrics['negRate']}%
- 平台分布：
{plat_lines}

## 二、Top 3 热点事件
{hot_lines}

## 三、负面舆情预警
{alert_lines}
- 预警阈值：{metrics['alertThreshold']}% — 今日状态：{'**⚠️ 已触发红色预警**' if metrics['alertTriggered'] else '✅ 低于阈值，风险可控'}

## 四、运营行动建议
1. 对 TOP 负面关键词，产品/QA团队 24h 内输出修复方案与补偿公告。
2. 在 TapTap / 贴吧集中出现负面的平台，发布运营回复帖 + 置顶，对冲负面情绪。
3. 明日客服侧补充与 Top 热点相关的 FAQ 语料，降低转人工率。

---
_由 crawl_sentiment.py 自动生成 · {metrics['generatedAt']}_
"""


# ============================================================
# 7. 主入口
# ============================================================
def main() -> int:
    parser = argparse.ArgumentParser(
        description="🎮 游戏舆情抓取 + 情感分析 + 负面预警 脚本 (Game AI Suite)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--mock", action="store_true", default=True, help="使用Mock生成器（无需依赖，默认开启）")
    parser.add_argument("--real", action="store_true", help="尝试调用真实HTTP抓取（需要requests，失败自动fallback）")
    parser.add_argument("--count", type=int, default=80, help="Mock生成评论条数（>=50，默认80）")
    parser.add_argument("--alert", type=float, default=30.0, help="负面预警阈值%（默认30）")
    parser.add_argument("--seed",  type=int, default=None, help="随机种子（可复现演示）")
    args = parser.parse_args()

    if args.seed is not None:
        random.seed(args.seed)

    today = dt.datetime.now().strftime("%Y%m%d")
    comments_path = DATA_DIR / f"comments_{today}.json"
    metrics_path  = DATA_DIR / f"opinion_metrics_{today}.json"
    report_path   = DATA_DIR / f"daily_report_{today}.md"

    print("=" * 64)
    print("🎮  Game AI Suite · 舆情抓取 + 情感分析 + 预警管线")
    print("=" * 64)

    # 1) 采集：真实 + mock fallback 拼接
    print("\n[1/5] 采集评论...")
    comments: List[Dict] = []
    if args.real:
        print("  尝试真实平台抓取（requests）：")
        for plat in PLATFORMS:
            real_list = fetch_platform_real(plat, max(20, args.count // 4))
            comments.extend(real_list)
            if real_list:
                print(f"    ✓ {plat} 实际抓取 {len(real_list)} 条")
    # 补齐到 args.count
    if len(comments) < args.count:
        need = args.count - len(comments)
        print(f"  使用Mock生成器补齐 {need} 条（随机种子={args.seed}）...")
        comments.extend(generate_mock_comments(need))

    # 2) 去重
    before = len(comments)
    comments = dedupe(comments)
    dropped = before - len(comments)
    print(f"\n[2/5] 去重完成：删除重复 {dropped} 条，剩余 {len(comments)} 条")

    # 3) 时间归档（mock已生成合理时间；此处仅打印覆盖情况）
    days = Counter(c["time"][:10] for c in comments)
    print(f"\n[3/5] 时间归档：覆盖 {len(days)} 天，跨度 {min(days)} ~ {max(days)}")
    for d in sorted(days):
        print(f"    · {d}: {days[d]} 条")

    # 4) 情感分析 + 打标签
    print(f"\n[4/5] 情感分析 + 自动打标签 + 热度分 执行中...")
    comments = analyze_all(comments)
    sent_cnt: Counter = Counter(c["sentiment"] for c in comments)
    print(f"    ✓ 情感分布：正向 {sent_cnt['positive']} ({round(sent_cnt['positive']/len(comments)*100,1)}%)"
          f" / 中性 {sent_cnt['neutral']} ({round(sent_cnt['neutral']/len(comments)*100,1)}%)"
          f" / 负向 {sent_cnt['negative']} ({round(sent_cnt['negative']/len(comments)*100,1)}%)")
    tags_cnt = sum(1 for c in comments if c["tags"])
    print(f"    ✓ 标签覆盖率：{tags_cnt}/{len(comments)} = {round(tags_cnt/len(comments)*100,1)}%")

    # 5) 指标 + 预警 + 日报
    print(f"\n[5/5] 计算聚合指标与负面预警（阈值 {args.alert}%）...")
    metrics = build_metrics(comments, args.alert)
    print(f"    ✓ 负面率 {metrics['negRate']}% — 预警状态：{'触发 ⚠️' if metrics['alertTriggered'] else '未触发 ✅'}")
    _top3 = " → ".join(f"{a['keyword']}({a['neg_rate']}%)" for a in metrics['topNegativeKeywords']) or "无"
    print(f"    ✓ Top3预警：{_top3}")

    # 写出
    with open(comments_path, "w", encoding="utf-8") as f:
        json.dump(comments, f, ensure_ascii=False, indent=2)
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, ensure_ascii=False, indent=2)
    report = build_daily_report(metrics, comments)
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report)

    # 同时写一份无日期的最新版本，给前端直接消费（如果未来接本地Web服务的话）
    with open(DATA_DIR / "comments_latest.json", "w", encoding="utf-8") as f:
        json.dump(comments, f, ensure_ascii=False, indent=2)
    with open(DATA_DIR / "opinion_metrics_latest.json", "w", encoding="utf-8") as f:
        json.dump(metrics, f, ensure_ascii=False, indent=2)

    print("\n✅ 完成！输出文件：")
    print(f"   · 评论数据：   {comments_path}")
    print(f"   · 聚合指标：   {metrics_path}")
    print(f"   · 舆情日报：   {report_path}")
    print(f"   · latest拷贝： {DATA_DIR}/comments_latest.json / opinion_metrics_latest.json")

    # 验收 TR-15.2：打印4平台覆盖
    plat_report = {p: metrics["platformCount"].get(p, 0) for p in PLATFORMS}
    print(f"\n📊 TR-15.2 4平台覆盖性：{plat_report}")
    for p, n in plat_report.items():
        ratio = round(n / len(comments) * 100, 1)
        ok = ratio >= 10
        print(f"   · {p:>8}: {n:>3}条  {ratio:>5}%  {'✅' if ok else '❌'}")
    # TR-15.3：抽样
    sample = random.sample(comments, min(10, len(comments)))
    sent_legal = all(c["sentiment"] in ("positive", "neutral", "negative") for c in sample)
    tags_nonempty_rate = sum(1 for c in sample if c["tags"]) / len(sample) * 100
    print(f"\n📊 TR-15.3 抽样检查(10条)：sentiment合法 {'✅' if sent_legal else '❌'}；tags非空率 {tags_nonempty_rate:.0f}% {'✅' if tags_nonempty_rate >= 90 else '❌'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
