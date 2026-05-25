import type { TopicIdea, TopicStyle } from "@/types/topic";

const STYLE_TEMPLATES: Record<TopicStyle, Partial<TopicIdea>[]> = {
  "深度解读": [
    {
      angle: "政策背后的真实逻辑",
      hookReason: "满足用户对「为什么出台这个政策」的好奇心，信息增量高",
    },
    {
      angle: "行业影响深度推演",
      hookReason: "从单一事件推演到产业链变化，专业感强、转发率高",
    },
    {
      angle: "历史对比与趋势判断",
      hookReason: "用时间维度增加内容厚度，适合长文阅读和收藏",
    },
  ],
  "热点评论": [
    {
      angle: "第一时间表态立论",
      hookReason: "速度即流量，先声夺人的观点最容易引发讨论",
    },
    {
      angle: "反常识视角质疑",
      hookReason: "与主流舆论唱反调，天然具备冲突感和传播力",
    },
    {
      angle: "情绪共鸣型点评",
      hookReason: "替目标群体说出心里话，评论区互动率极高",
    },
  ],
  "科普拆解": [
    {
      angle: "用数据拆解真相",
      hookReason: "数字和图表降低理解门槛，可信度高、易被引用",
    },
    {
      angle: "流程图式步骤拆解",
      hookReason: "结构清晰、一目了然，适合快速阅读和收藏",
    },
    {
      angle: "误区澄清与知识补全",
      hookReason: "纠正大众误解，实用价值强，搜索长尾流量好",
    },
  ],
  "故事化": [
    {
      angle: "当事人第一人称叙事",
      hookReason: "真实故事自带代入感，完读率和分享意愿双高",
    },
    {
      angle: "小人物见大时代",
      hookReason: "用个体命运折射宏观变化，情感冲击力最强",
    },
    {
      angle: "悬念式追踪报道",
      hookReason: "制造信息缺口，驱动用户追更和持续关注",
    },
  ],
  "争议讨论": [
    {
      angle: "正方反方观点交锋",
      hookReason: "争议性话题天然具备讨论基因，评论区即内容",
    },
    {
      angle: "投票式互动引导",
      hookReason: "低参与门槛的互动设计，算法推荐权重更高",
    },
    {
      angle: "伦理边界探讨",
      hookReason: "触及价值观层面的讨论，容易引发圈层传播",
    },
  ],
  "数字化解决方案": [
    {
      angle: "问题-方案-价值闭环",
      hookReason: "直击业务痛点并给出系统解法，决策者和执行层都爱看",
    },
    {
      angle: "技术赋能场景拆解",
      hookReason: "把抽象的数字化能力落到具体场景，可信度高、易复制",
    },
    {
      angle: "数据驱动效果验证",
      hookReason: "用真实数据佐证方案价值，适合 ToB 传播和客户转化",
    },
  ],
};

function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 1000) / 1000;
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.floor(seed * arr.length) % arr.length];
}

function extractKeywords(text: string): string {
  const clean = text
    .replace(/[，。；：！？、""''（）【】《》]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = clean.split(" ").filter((w) => w.length >= 2 && w.length <= 8);
  return words.slice(0, 3).join("");
}

export function generateTopicIdeas(
  newsDesc: string,
  platforms: string[],
  style: TopicStyle
): TopicIdea[] {
  const seed = seededRandom(newsDesc + style);
  const keyword = extractKeywords(newsDesc) || "这一事件";
  const templates = STYLE_TEMPLATES[style];

  const baseTitles: Record<TopicStyle, string[]> = {
    "深度解读": [
      `为什么${keyword}会引发如此广泛的讨论？背后的逻辑不简单`,
      `${keyword}：表面看是政策调整，实质是行业格局重塑`,
      `从${keyword}看未来五年趋势，几个信号值得注意`,
      `${keyword}背后的三组数据，揭示了一个被忽视的真相`,
      `专访业内人士：${keyword}对普通人到底意味着什么`,
    ],
    "热点评论": [
      `${keyword}刷屏后，我想泼一点冷水`,
      `关于${keyword}，媒体和公众都忽略了一个关键点`,
      `${keyword}让我意识到，我们太容易情绪上头了`,
      `别急着站队，${keyword}还有另一面`,
      `${keyword}发生后，最该反思的其实不是当事人`,
    ],
    "科普拆解": [
      `一张图看懂${keyword}的来龙去脉`,
      `${keyword}涉及的5个核心概念，90%的人理解错了`,
      `专家没说明白的${keyword}，我用大白话讲清楚`,
      `${keyword}到底怎么运作？3分钟建立系统认知`,
      `关于${keyword}，你需要知道的7个事实与3个误区`,
    ],
    "故事化": [
      `我是一名亲历者，想讲讲${keyword}背后真实的故事`,
      `${keyword}发生那天， ordinary 人的生活被改变了`,
      `从抵触到理解：一个普通人眼中的${keyword}`,
      `${keyword}十年追踪：当初那批人现在怎么样了`,
      `那个因${keyword}而上热搜的人，后来怎样了`,
    ],
    "争议讨论": [
      `${keyword}：支持还是反对？我的观点可能两边不讨好`,
      `关于${keyword}，为什么聪明人也会做出错误判断`,
      `${keyword}引发的争议，本质上是在争什么`,
      `如果${keyword}发生在你身上，你会怎么选`,
      `${keyword}的边界在哪里？这个话题值得认真讨论`,
    ],
    "数字化解决方案": [
      `${keyword}背后，一套数字化系统如何解决90%的管理难题`,
      `从${keyword}看资产数字化：不是上系统，而是重构运营逻辑`,
      `${keyword}场景下，数据驱动的精细化管理怎么做`,
      `破解${keyword}痛点：从人工台账到数字孪生的跃迁路径`,
      `${keyword}的数字化解法：问题诊断、方案落地、效果验证三步走`,
    ],
  };

  const titles = baseTitles[style];
  const count = 5 + Math.floor(seededRandom(newsDesc) * 3); // 5-7 个

  const ideas: TopicIdea[] = [];
  for (let i = 0; i < count; i++) {
    const tpl = templates[i % templates.length];
    const title = titles[i % titles.length];
    const platformCount = 1 + Math.floor(seededRandom(newsDesc + i) * Math.min(3, platforms.length));
    const shuffled = [...platforms].sort(() => seededRandom(newsDesc + i + "p") - 0.5);

    ideas.push({
      id: `topic-${i}-${Date.now()}`,
      title,
      angle: tpl.angle || "多维度分析",
      platforms: shuffled.slice(0, platformCount),
      hookReason: tpl.hookReason || "角度新颖，信息增量高",
      openingSuggestion: generateOpening(keyword, style, i),
    });
  }

  return ideas;
}

function generateOpening(keyword: string, style: TopicStyle, index: number): string {
  const openings: Record<TopicStyle, string[]> = {
    "深度解读": [
      `很多人看到${keyword}的第一反应是……但如果你把时间线拉长，会发现这件事的逻辑远比表面复杂。`,
      `先说结论：${keyword}不是一个孤立事件。要理解它，我们需要回到三年前的那个政策节点。`,
    ],
    "热点评论": [
      `${keyword}这几天刷屏了。朋友圈里有人欢呼，有人愤怒，但很少有人追问一句：我们讨论的真的是同一件事吗？`,
      `刷到${keyword}的新闻时，我的第一反应是意外。但冷静下来想，这或许早有征兆。`,
    ],
    "科普拆解": [
      `${keyword}最近很火，但大多数人其实没搞明白它到底是怎么运作的。今天用3分钟帮你理清。`,
      `关于${keyword}，网上信息很多，但碎片化严重。我试着把它拆解成几个你能直接上手理解的模块。`,
    ],
    "故事化": [
      `去年这个时候，老王还在为自己的决定后悔。直到${keyword}发生，他才意识到，命运的转折往往来得毫无征兆。`,
      `如果要选一个人来讲${keyword}的故事，我想选小李。不是因为她的经历最典型，而是因为她代表了我们中的大多数人。`,
    ],
    "争议讨论": [
      `${keyword}出来后，我观察到一个有趣的现象：支持的人和反对的人，根本不在同一个频道上对话。`,
      `关于${keyword}，我想先抛一个问题：如果你是当事人，你会怎么做？先别急着回答，看完再判断。`,
    ],
    "数字化解决方案": [
      `很多物业同行跟我聊${keyword}时，最大的困惑不是不知道要改，而是不知道从哪里下手。今天分享一套已经跑通的数字化解法。`,
      `${keyword}看似是个管理问题，但拆解到底层，其实是数据问题。没有实时、准确的资产数据，精细化运营就是空中楼阁。`,
    ],
  };
  const list = openings[style];
  return list[index % list.length];
}
