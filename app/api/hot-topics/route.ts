import { NextResponse } from "next/server";
import { DEFAULT_HOT_TOPICS, type HotTopic } from "@/lib/hot-topics-seed";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

// 内存缓存：30分钟
interface CacheEntry {
  data: HotTopic[];
  ts: number;
  fallback: boolean;
  error: string;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 30 * 60 * 1000;

async function fetchHotTopicsWithDeepseek(): Promise<HotTopic[]> {
  const systemPrompt = `你是一位地产/物业/城市更新/产业园区行业的资深媒体观察员。

任务：基于最新行业知识，整理近3天内与以下领域相关的热点话题、行业动态、市场变化或重大事件：
- 物业管理、智慧物业、物业数字化
- 商业地产、写字楼、产业园区
- 城市更新、老旧小区改造、城中村改造
- 长租公寓、公寓运营
- 资产管理、REITs、招商运营
- 房地产科技、智慧社区、建筑智能化

要求：
1. 基于你的最新知识，尽量贴近真实热点，不要编造不存在的事件。
2. 优先选择行业案例、市场数据、企业动态、运营经验类话题。
3. 避免纯政策文件复述类话题（政策类容易被限流）。
4. 每条热点必须进行分类，只能属于以下三类之一："城市更新"、"地产"、"物业"。
5. 返回严格有效的 JSON 数组，不要 Markdown 代码块。

每个元素结构：
{
  "title": "热点标题，简洁有力",
  "source": "信息来源（如：新浪财经/36氪/物业深度观察/克而瑞）",
  "date": "YYYY-MM-DD",
  "category": "城市更新" | "地产" | "物业"
}

数组长度：8-12条。`;

  const userPrompt = `请整理近3天物业/地产/城市更新/产业园区行业的热点话题，返回JSON数组。`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: 2000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API 错误: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const aiContent = data.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error("DeepSeek 返回内容为空");
    }

    // 去除可能的 Markdown 代码块
    const cleaned = aiContent
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const parsed = JSON.parse(cleaned);
    const topics = Array.isArray(parsed) ? parsed : parsed.topics || parsed.data || [];

    return topics
      .filter((t: { title?: string }) => t && typeof t.title === "string" && t.title.length > 5)
      .slice(0, 12)
      .map((t: { title: string; source?: string; date?: string; category?: string }) => {
        const cat = t.category;
        const validCategory = cat === "城市更新" || cat === "地产" || cat === "物业" ? cat : "地产";
        return {
          title: t.title,
          source: t.source || "行业观察",
          date: t.date || new Date().toISOString().slice(0, 10),
          category: validCategory,
        };
      });
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.has("refresh");

  // 检查缓存（强制刷新时跳过）
  const cached = cache.get("hot-topics");
  if (!forceRefresh && cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({
      topics: cached.data,
      cached: true,
      fallback: cached.fallback,
      error: cached.error,
    });
  }

  let result: HotTopic[];
  let fallback = false;
  let errorMsg = "";

  try {
    result = await fetchHotTopicsWithDeepseek();
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    console.error("[hot-topics] DeepSeek 热点获取失败，使用兜底数据。错误:", errMsg);
    result = DEFAULT_HOT_TOPICS;
    fallback = true;
    errorMsg = errMsg;
  }

  // 如果返回不足5条，用兜底数据补充
  if (result.length < 5) {
    const seen = new Set(result.map((r) => r.title));
    const needed = DEFAULT_HOT_TOPICS.filter((d) => !seen.has(d.title));
    result = [...result, ...needed.slice(0, 10 - result.length)];
    fallback = true;
  }

  // 限制最多12条
  result = result.slice(0, 12);

  // 写入缓存（只有成功获取到真实数据时才缓存；兜底数据不缓存，下次重试）
  if (!fallback) {
    cache.set("hot-topics", { data: result, ts: Date.now(), fallback: false, error: "" });
  }

  return NextResponse.json({ topics: result, fallback, error: errorMsg });
}
