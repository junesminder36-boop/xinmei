import { NextRequest, NextResponse } from "next/server";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, angle, opening, platforms, style, structure } = body as {
      title: string;
      angle: string;
      opening: string;
      platforms: string[];
      style: string;
      structure?: string;
    };

    if (!title || !angle) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const systemPrompt = `你是一位资深新媒体内容总监，擅长为不同平台撰写高质量原创稿件。

要求：
1. 严格根据给定的选题标题和切入角度撰写完整文章。
2. 文章要有清晰的结构（标题、开头、正文、结尾）。
3. 字数要求：公众号/知乎 1200-2000 字，头条/百家号 800-1500 字，小红书 600-800 字。如果涉及多个平台，按最长平台标准撰写。
4. 语言风格要贴合目标平台调性。
5. 开头要吸引人，正文要有案例/数据/观点支撑，结尾要有金句或行动号召。
6. 避免使用"首先、其次、最后"等模板化连接词。
7. 不要出现具体企业名称（用"某国企/某民企/某头部企业"代替），除非有明确授权。
8. 政策发布要写上具体日期，不要用"近期/日前"等模糊表述。
9. 输出格式严格如下：

标题：（文章标题）
正文：
（文章正文内容）

不要输出其他说明文字。`;

    const userPrompt = `请根据以下信息生成一篇完整的文章：

选题标题：${title}
切入角度：${angle}
目标平台：${platforms.join("、")}
风格方向：${style}
${structure ? `推荐结构：${structure}` : ""}
开头建议：${opening}

请直接输出文章标题和正文。`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

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
        temperature: 0.7,
        max_tokens: 4000,
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

    // 解析返回的内容，提取标题和正文
    const titleMatch = aiContent.match(/^标题[:：]\s*(.+)$/m);
    const contentMatch = aiContent.match(/^正文[:：]\s*([\s\S]+)$/m);

    const generatedTitle = titleMatch?.[1]?.trim() || title;
    const generatedContent = contentMatch?.[1]?.trim() || aiContent;

    return NextResponse.json({
      title: generatedTitle,
      content: generatedContent,
    });
  } catch (error) {
    console.error("生成文章失败:", error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `生成文章失败: ${errMsg}` },
      { status: 500 }
    );
  }
}
