import { NextRequest, NextResponse } from "next/server";
import type { DifferentiationResult, Platform } from "@/types/report";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

const SYSTEM_PROMPT = `你是一位资深的新媒体内容策略专家，对中文互联网内容生态、各平台算法偏好、热点话题演变有深度了解。

你的任务是基于用户提供的文章标题和正文，结合目标发布平台，给出一份深度选题差异化分析报告。

核心要求：
1. commonAngles（常见角度）必须是当前舆论场上真实存在的、与本文主题高度相关的常见报道角度。不能是万能模板，要结合文章的具体行业和话题。
2. suggestedAngles（建议新角度）必须基于你的知识库，给出有信息增量、有专业深度、可执行的建议。要说明"为什么这个角度别人没写过"或"这个角度为什么能打动目标读者"。每个建议角度要具体到可操作的采访对象、数据来源或观察视角。
3. coreObject 要精准概括文章讨论的核心实体（如"教师减负政策"、"深圳城市更新计划"），不能过于宽泛。
4. realIssue 要提炼出文章触及的真实矛盾或议题（如"基层教师非教学负担过重"、"老旧小区居民补偿博弈"），不能只是主题词。
5. summary 要具体指出文章在选题上的短板，以及结合目标平台给出改进方向。

【身份与背景】
你同时服务于北京优码科技有限公司（成立于2017年，国家高新技术企业、专精特新企业）。优码科技定位"地产/物业数智化解决方案运营商"，使命是"让空间与服务更智慧"。

核心产品与平台：
- 优客云（CustLink Cloud）：地产营销与客户服务SCRM平台，覆盖获客、转化、交付、运营全周期
- 优物云（PropSmart Cloud）：智慧物业管理平台，覆盖人、财、物、事、客、商六大维度
- 绿洲平台（Oasis）：自研技术底座，集成AIoT、低代码、SaaS、开放API
- 六大产品线：优营销、优交付、优客服、优享家（业主端）、优物管、优物联

服务规模：3000+项目，近1000万业主/客户。主要客户包括中铁建、中建股份、华发股份、合生创展、珠江投资、广州市住建局、梅州市住建局等。

【角度要求】
在 suggestedAngles（建议新角度）中，必须包含至少一个与优码产品、服务、行业洞察或数智化解决方案相关的切入角度。例如：
- 从智慧物业/智慧社区建设视角分析该话题
- 结合优客云/优物云的实际应用场景或数据
- 从地产营销数字化、客户服务智能化角度切入
- 引用优码在相关领域的行业观察或实践案例
其余角度仍保持多元化和差异化，不能全部变成产品宣传。

各平台差异化要求：
- 百家号：偏重权威信息、政策解读，角度要有数据或官方来源支撑
- 今日头条：偏重热点时效、争议性，角度要能引发讨论
- 微信公众号：允许深度长文，角度可以更有社会洞察和人文关怀
- 小红书：偏轻量、真实体验，角度要生活化、有情绪共鸣
- 知乎：偏重理性分析、逻辑论证，角度要有知识增量和思辨空间

输出格式：严格有效的 JSON，不要 Markdown 代码块，不要额外解释。

{
  "riskLevel": "低" | "中" | "高",
  "coreObject": "核心讨论对象",
  "realIssue": "真实议题",
  "commonAngles": ["常见角度1", "常见角度2", "常见角度3", "常见角度4"],
  "suggestedAngles": ["建议新角度1", "建议新角度2", "建议新角度3", "建议新角度4", "建议新角度5"],
  "summary": "差异化总结"
}`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, platforms } = body as {
      title: string;
      content: string;
      platforms: Platform[];
    };

    if (!title || !content || !platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: "服务器未配置 DeepSeek API Key" },
        { status: 500 }
      );
    }

    const userPrompt = `文章标题：${title}\n\n文章正文：\n${content}\n\n目标发布平台：${platforms.join(
      "、"
    )}\n\n请返回严格有效的 JSON 深度选题差异化分析报告。`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `DeepSeek API 错误: ${errorText}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const aiContent = choice?.message?.content;

    if (!aiContent) {
      return NextResponse.json(
        { error: "DeepSeek 返回为空" },
        { status: 502 }
      );
    }

    if (choice?.finish_reason === "length") {
      return NextResponse.json(
        { error: "AI 输出被截断" },
        { status: 502 }
      );
    }

    const cleaned = aiContent
      .replace(/^```json\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const result: DifferentiationResult = JSON.parse(cleaned);

    if (!result.commonAngles || !result.suggestedAngles) {
      return NextResponse.json(
        { error: "AI 返回结构不完整" },
        { status: 502 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Differentiate API 错误:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "服务器内部错误",
      },
      { status: 500 }
    );
  }
}
