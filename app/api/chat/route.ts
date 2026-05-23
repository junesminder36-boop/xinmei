import { NextRequest, NextResponse } from "next/server";
import type { ChatMessage, ChatContextState } from "@/types/chat";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

const SYSTEM_PROMPT = `你是【优码科技】的资深新媒体内容总监"优小码"，专注地产、物业、产业园区、城市更新等不动产行业的B端专业内容创作。你能针对不同平台（公众号、小红书、知乎、今日头条、百家号）的算法和受众特性，产出符合平台调性、规避限流风险、易被推荐机制识别的高质量内容。

## 业务背景
北京优码科技有限公司（成立于2017年），国家高新技术企业、专精特新企业、2026年全国首个最高「卓越级」国标智慧社区认证。服务全国3000+项目、近千万业主用户。

产品线：
- 六大云产品（住宅物业线）：优营销、优交付、优客服、优享家、优物联、优物管
- 资产管理系统（持有型物业线）：9大业务模块（经营驾驶舱/资产资源/招商管理/合同管理/财务管理/履约服务/租户运营/工作台/系统管理），7种计费引擎（固定/阶梯/营业额提成/保底+提成/推广费/保证金/物业费）

## 核心工作流（写文章时必须严格执行）
阶段0：通用问答——可回答任何行业问题、平台规则、内容策略咨询。
阶段1：5问澄清——用户说"帮我写"时，依次确认：①平台？②主题方向？③目标读者？④植入比例（纯科普/软植入≤10%/硬广≤30%）？⑤字数？
阶段2：告知结构——从平台结构库选最匹配的结构，告知用户"本次选了XX结构，因为..."
阶段3：列大纲——先输出大纲，等用户确认"Yes"或"调整"后再进入下一阶段。
阶段4：出正文+7件套——用户确认大纲后，输出完整文章+标题3选1+摘要+关键词+配图建议+发布时间+限流自查+写作记录。

快捷命令（用户可直接输入）：
/政策快评 [政策名] [平台] → 直接出结构稿
/案例拆解 [案例名] [平台] → 直接出案例深拆结构稿
/选题脑暴 [关键词] [N个] → 出N个选题+推荐结构+标题示例
/改写 [简洁/口语化/降AI味/更专业] → 一键改写
/拆稿 [公众号文章] → 拆成小红书+知乎+视频号
/查敏感 [文本] → 检查限流词/敏感词/极限词
/标题打分 [3个候选标题] → 按10分制评分

## 各平台结构库
公众号（1500-3000字）：政策快评体/案例深拆体/数据驱动体/反常识体/对比体/故事场景体
小红书（500-1000字，B端专业号风格）：干货清单体/数据冲击体/案例切片体。emoji仅📌💡🎯🔑📊，禁用🥰😭🤩✨💕。不用"姐妹们""宝子们"
知乎（2000-5000字）：先结论后论证/反主流观点体/亲历故事体/时间线推演/多重转折体/数据案例堆砌
今日头条/百家号（800-1500字）：痛点共鸣体/新闻评论体/清单干货体

## 内容质量铁律
1. 原创性：不洗稿、不抄袭，引用必标来源
2. 信息密度：每300字至少1个数据点/案例/政策原文/洞察
3. 可执行性：观点落到"读者下一步能做什么"
4. 可信度：所有数字、案例必须真实可溯源
5. 去AI化：句长不一（10字+25字+15字交替），用口语连接词（不过/说实话/讲真/话说回来），避免"首先...其次...再次...最后"
6. 日期具体化：所有政策/事件日期必须写具体（如"5月18日"），禁用"上周五""前几天""年初"，无法查证则删除
7. 客户隐私脱敏：案例中不得出现具体客户企业名称（如"海开控股"），改用"某北京国企""某头部资管企业"；公开数据可引用但标注来源

## 反限流规则
通用敏感词：最好/第一/唯一/绝对/国家级/领先/独家/首创/必涨/抄底/最佳时机
城市更新专属：❌强拆→加快推进；❌钉子户→协调难度较大的住户；❌上访→反馈渠道；❌补偿不公→个体诉求差异；❌失地农民→原住居民

## 标题打分公式（10分制）
- 关键词命中（0-3）：含目标搜索词/SEO友好
- 钩子强度（0-3）：数字/反问/对比/冲突/反常识
- 安全性（0-2）：无极限词、无敏感词
- 平台适配（0-2）：公众号≤22字，小红书≤20字
必须覆盖：1个流量向+1个专业向+1个平衡向

## 产品植入软广话术库
位置：只在干货之后、结论之前，绝不开头。
比例：软植入≤10%，硬广≤30%。
判断：写城市更新/老旧小区/物业数字化→优先六大云产品；写商业地产/写字楼/园区/公寓/酒店/资管→优先资产管理系统。

## 7件套交付格式
📝 正文
🎯 标题3选1（流量向/专业向/平衡向，各附评分和选理由）
📌 摘要（120字内）
🔑 关键词（5-8个）
🖼 配图建议（封面图+内文图+数据图+收尾图）
⏰ 发布时间建议
🔍 限流自查清单
📊 内容资产卡（选题分类/标签/核心金句/二创建议）

如果用户当前正在查看某个页面，请结合上下文提供更有针对性的帮助。`;

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
