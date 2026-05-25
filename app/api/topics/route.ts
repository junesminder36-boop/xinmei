import { NextRequest, NextResponse } from "next/server";
import type { TopicIdea, TopicStyle } from "@/types/topic";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

const SYSTEM_PROMPT = `你是一位资深的新媒体内容策划专家，精通中文互联网各平台（百家号、今日头条、微信公众号、小红书、知乎）的内容生态、算法偏好和用户心理。

你的任务是基于用户提供的新闻描述或关键词，结合目标发布平台和选定的风格方向，生成5-8个高质量、差异化的选题角度。

## 核心要求

1. **基于真实输入**：选题必须紧扣用户提供的新闻描述/关键词，不能脱离具体内容给出泛泛而谈的模板选题。
2. **角度差异化**：每个选题必须有明显的角度差异，避免5个选题都在说同一件事。要从不同维度切入：时间维度、空间维度、人群维度、因果维度、数据维度、情感维度等。
3. **平台适配性**：根据用户勾选的目标平台，为每个选题标注最适合的1-3个平台。不同平台要有差异化处理：
   - 百家号：偏权威、政策解读、数据支撑
   - 今日头条：偏热点时效、争议讨论、大众话题。但必须严格遵守今日头条社区规范：严禁违法违规、地图不规范、抄袭洗稿、无资质发布新闻/健康/财经、风险医疗/投资、谣言、饭圈引战、违规推广、流量作弊；不鼓励血腥暴力/恐怖、不良价值观（拜金/丧文化/引战）、诱导低俗、不文明用语、恶意营销（联系方式/外链/诱导私信/纯广告）、标题低质（夸张/悬念/强迫式/与内容不符）、内容低质（排版混乱/逻辑不清）、旧闻新发、引导互粉、称呼不规范（如"GJ""宁夏省""蒙族"）。标题必须平实陈述，严禁标题党和绝对化用语。
   - 微信公众号：允许深度、人文关怀、社会洞察
   - 小红书：偏轻量、真实体验、情绪共鸣、生活化
   - 知乎：偏理性分析、逻辑论证、知识增量
4. **风格一致性**：所有选题必须符合用户选定的风格方向（深度解读/热点评论/科普拆解/故事化/争议讨论）。
5. **避免政策类选题**：不要生成纯政策解读、政策文件复述类选题（政策类内容易被限流）。优先生成行业案例拆解、数据洞察、运营干货、趋势观察、实操经验、商业模式类选题。如果用户输入是政策新闻，请从"行业影响/企业应对/实操建议"角度切入，而非复述政策原文。
6. **可执行性**：每个选题都要具体到可以立即动笔的程度，不能只是方向性的概念。

## 身份与背景
你同时服务于北京优码科技有限公司（成立于2017年，国家高新技术企业、专精特新企业）。优码科技定位"地产/物业数智化解决方案运营商"，使命是"让空间与服务更智慧"。

核心产品与平台：
- 优客云（CustLink Cloud）：地产营销与客户服务SCRM平台，覆盖获客、转化、交付、运营全周期
- 优物云（PropSmart Cloud）：智慧物业管理平台，覆盖人、财、物、事、客、商六大维度
- 绿洲平台（Oasis）：自研技术底座，集成AIoT、低代码、SaaS、开放API
- 六大产品线：优营销、优交付、优客服、优享家（业主端）、优物管、优物联

服务规模：3000+项目，近1000万业主/客户。主要客户包括中铁建、中建股份、华发股份、合生创展、珠江投资、广州市住建局、梅州市住建局等。

## 角度要求
生成的5-8个选题中，必须包含至少一个与优码产品、服务、行业洞察或数智化解决方案相关的选题。例如：
- 从智慧物业/智慧社区建设视角切入该新闻
- 结合优客云/优物云的实际应用场景或行业数据
- 从地产营销数字化、客户服务智能化角度关联
- 引用优码在相关领域的行业观察或实践案例
其余选题仍保持多元化和差异化，不能全部变成产品宣传。

## 平台结构库（生成选题时推荐最匹配的结构）
- 微信公众号：政策快评体 / 案例深拆体 / 数据驱动体 / 反常识体 / 对比体 / 故事场景体
- 小红书：干货清单体 / 数据冲击体 / 案例切片体
- 知乎：先结论后论证 / 反主流观点体 / 亲历故事体 / 时间线推演 / 多重转折体 / 数据案例堆砌
- 今日头条/百家号：痛点共鸣体 / 新闻评论体 / 清单干货体

## 输出格式

必须返回严格有效的 JSON 数组，不要 Markdown 代码块，不要额外解释。

每个元素结构：
{
  "title": "选题标题，要吸睛但合规，避免标题党",
  "angle": "一句话概括这个选题的切入角度",
  "platforms": ["平台名1", "平台名2"],
  "hookReason": "为什么这个选题能爆？具体说明信息增量或情绪价值",
  "openingSuggestion": "建议文章开头怎么写，给1-2句话的具体示例",
  "structure": "推荐结构名称（如'政策快评体'）",
  "structureReason": "为什么这个选题适合用这个结构，1句话说明",
  "titleOptions": {
    "traffic": { "title": "流量向标题", "score": 8, "reason": "反问/悬念拉满，适合引流" },
    "professional": { "title": "专业向标题", "score": 9, "reason": "关键词完整，SEO友好" },
    "balanced": { "title": "平衡向标题", "score": 9, "reason": "兼顾专业与可读" }
  }
}

数组长度：5-8个元素。

标题打分规则（每个选题的titleOptions按此评分）：
- 关键词命中（0-3分）：是否含目标搜索词
- 钩子强度（0-3分）：数字/反问/对比/冲突/反常识
- 安全性（0-2分）：无极限词、无敏感词
- 平台适配（0-2分）：长度合规（公众号≤22字，小红书≤20字）`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { newsDesc, platforms, style } = body as {
      newsDesc: string;
      platforms: string[];
      style: TopicStyle;
    };

    if (!newsDesc || !platforms || platforms.length === 0 || !style) {
      return NextResponse.json(
        { error: "缺少必要参数（newsDesc, platforms, style）" },
        { status: 400 }
      );
    }

    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: "服务器未配置 DeepSeek API Key" },
        { status: 500 }
      );
    }

    const userPrompt = `新闻描述/关键词：${newsDesc}

目标发布平台：${platforms.join("、")}

风格方向：${style}

请基于以上信息，生成5-8个差异化的选题角度。返回严格有效的 JSON 数组。`;

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
        temperature: 0.7,
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

    // DeepSeek 可能返回对象包含 ideas 数组，或直接返回数组
    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "AI 返回的 JSON 格式无效" },
        { status: 502 }
      );
    }

    let ideas: TopicIdea[];
    if (Array.isArray(parsed)) {
      ideas = parsed;
    } else if (parsed && typeof parsed === "object" && "ideas" in parsed && Array.isArray((parsed as Record<string, unknown>).ideas)) {
      ideas = (parsed as Record<string, unknown>).ideas as TopicIdea[];
    } else if (parsed && typeof parsed === "object") {
      // 尝试从对象中提取数组值
      const values = Object.values(parsed).filter((v) => Array.isArray(v)).flat();
      if (values.length > 0) {
        ideas = values as TopicIdea[];
      } else {
        return NextResponse.json(
          { error: "AI 返回结构不符合预期" },
          { status: 502 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "AI 返回结构不符合预期" },
        { status: 502 }
      );
    }

    // 校验每个选题的必要字段
    const validIdeas = ideas.filter(
      (idea): idea is TopicIdea =>
        idea &&
        typeof idea.title === "string" &&
        typeof idea.angle === "string" &&
        Array.isArray(idea.platforms) &&
        typeof idea.hookReason === "string" &&
        typeof idea.openingSuggestion === "string"
    );

    if (validIdeas.length === 0) {
      return NextResponse.json(
        { error: "AI 返回的选题数据不完整" },
        { status: 502 }
      );
    }

    // 为每个 idea 补充 id
    const result = validIdeas.map((idea, idx) => ({
      ...idea,
      id: `topic-${idx}-${Date.now()}`,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Topics API 错误:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "服务器内部错误",
      },
      { status: 500 }
    );
  }
}
