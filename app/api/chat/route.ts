import { NextRequest, NextResponse } from "next/server";
import type { ChatMessage, ChatContextState } from "@/types/chat";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

const SYSTEM_PROMPT = `你是一位资深的新媒体内容创作助手，同时也是北京优码科技有限公司（成立于2017年，国家高新技术企业、专精特新企业）的智能助手"优小码"。

优码科技定位"地产/物业数智化解决方案运营商"，使命是"让空间与服务更智慧"。

核心产品与平台：
- 优客云（CustLink Cloud）：地产营销与客户服务SCRM平台，覆盖获客、转化、交付、运营全周期
- 优物云（PropSmart Cloud）：智慧物业管理平台，覆盖人、财、物、事、客、商六大维度
- 绿洲平台（Oasis）：自研技术底座，集成AIoT、低代码、SaaS、开放API
- 六大产品线：优营销、优交付、优客服、优享家（业主端）、优物管、优物联

服务规模：3000+项目，近1000万业主/客户。主要客户包括中铁建、中建股份、华发股份、合生创展、珠江投资、广州市住建局、梅州市住建局等。

你的能力：
1. 基于用户提供的选题灵感、建议角度或现有文章，生成完整的、可直接发布的新媒体文章。
2. 回答任何与新媒体运营、内容创作、平台规则、优码产品相关的问题。
3. 帮助用户优化标题、检查合规性、改写内容。

写作要求：
- 文章要结构完整，有吸引力强的标题、引人入胜的开头、层次分明的正文和有力的结尾。
- 根据不同平台（百家号、今日头条、微信公众号、小红书、知乎）调整语气和风格。
- 避免标题党、绝对化用语和未核验的政策引用。
- 保持内容真实可信，信息增量高。

如果用户当前正在查看某个页面（文章智检或选题灵感），请结合上下文提供更有针对性的帮助。`;

function buildContextPrompt(context?: ChatContextState): string {
  if (!context) return "";

  const parts: string[] = [];

  if (context.mode === "analyze") {
    parts.push("【用户当前正在使用文章智检功能】");
    if (context.title) parts.push(`当前文章标题：${context.title}`);
    if (context.content) parts.push(`当前文章正文（前500字）：${context.content.slice(0, 500)}`);
    if (context.platforms?.length) parts.push(`目标平台：${context.platforms.join("、")}`);
    if (context.report) {
      parts.push(`综合评分：差异化 ${context.report.scores.differentiation}，可信度 ${context.report.scores.credibility}，安全 ${context.report.scores.safety}`);
      if (context.report.differentiation?.suggestedAngles?.length) {
        parts.push(`建议新角度：${context.report.differentiation.suggestedAngles.join("；")}`);
      }
    }
  } else if (context.mode === "inspiration") {
    parts.push("【用户当前正在使用选题灵感功能】");
    if (context.newsDesc) parts.push(`新闻描述/关键词：${context.newsDesc}`);
    if (context.selectedStyle) parts.push(`风格方向：${context.selectedStyle}`);
    if (context.platforms?.length) parts.push(`目标平台：${context.platforms.join("、")}`);
    if (context.topicIdeas?.length) {
      parts.push("已生成的选题：");
      context.topicIdeas.forEach((idea, i) => {
        parts.push(`${i + 1}. ${idea.title}（角度：${idea.angle}，平台：${idea.platforms.join("、")}）`);
      });
    }
  }

  return parts.length > 0 ? "\n\n【当前页面上下文】\n" + parts.join("\n") : "";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, context } = body as {
      messages: ChatMessage[];
      context?: ChatContextState;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "缺少消息内容" }, { status: 400 });
    }

    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: "服务器未配置 DeepSeek API Key" },
        { status: 500 }
      );
    }

    const contextPrompt = buildContextPrompt(context);
    const systemContent = SYSTEM_PROMPT + contextPrompt;

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
          { role: "system", content: systemContent },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
        temperature: 0.7,
        max_tokens: 4000,
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
      return NextResponse.json({ error: "DeepSeek 返回为空" }, { status: 502 });
    }

    return NextResponse.json({ reply: aiContent });
  } catch (error) {
    console.error("Chat API 错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "服务器内部错误" },
      { status: 500 }
    );
  }
}
