import type { Platform, TriggerType, RiskLevel } from "@/types/report";

export interface PlatformRuleEntry {
  id: string;
  name: string;
  description: string;
  riskLevel: RiskLevel;
  triggerType: TriggerType;
  keywords?: string[];
  platforms: Platform[];
  suggestion: string;
}

export const TITLE_RISK_WORDS = [
  "重大信号",
  "彻底",
  "全部",
  "不拆了",
  "变天",
  "炸了",
  "惊人",
  "终于",
  "100%",
  "90%的人不知道",
  "速看",
  "紧急",
  "震惊",
  "曝光",
  "揭秘",
  "重磅",
  "注意了",
  "不看后悔",
];

// 选题提取时要剔除的套路词（避免把"重大信号"当成主题）
export const TITLE_BAIT_BLACKLIST = [
  "重大信号",
  "彻底",
  "不拆了",
  "变天",
  "炸了",
  "惊人",
  "终于",
  "速看",
  "紧急",
  "震惊",
  "曝光",
  "揭秘",
  "重磅",
  "注意了",
  "不看后悔",
  "别再把",
  "别再",
  "不要",
  "千万不要",
  "所有人",
  "每个人",
  "普通人",
  "一文看懂",
  "深度解析",
  "全网首发",
  "刚刚宣布",
];

export const ABSOLUTE_WORDS = [
  "最",
  "第一",
  "唯一",
  "绝对",
  "必然",
  "永久",
  "彻底",
  "全网",
  "国家级",
  "顶级",
  "全部",
  "完全",
  "人人",
  "所有人",
  "永远",
];

export const POLICY_DEPARTMENTS = [
  "住建部",
  "发改委",
  "财政部",
  "国务院",
  "网信办",
  "市场监管局",
  "税务局",
  "人社局",
  "教育部",
  "卫健委",
];

export const POLICY_DOCUMENT_TERMS = [
  "通知",
  "意见",
  "办法",
  "规定",
  "条例",
  "细则",
  "方案",
  "文件",
];

export const POLICY_UNAMBIGUOUS_TERMS = [
  "文号",
  "征求意见稿",
  "印发",
  "依据",
  "根据",
];

export const POLICY_KEYWORDS_FOR_RULES = [
  ...POLICY_DEPARTMENTS,
  ...POLICY_UNAMBIGUOUS_TERMS,
];

export const POLICY_CONTEXT_PATTERNS = [
  // 部门 + 文件类型：住建部发布通知
  /(住建部|发改委|财政部|国务院|网信办|市场监管局|税务局|人社部|教育部|卫健委).*?(通知|意见|办法|规定|条例|细则|方案|文件)/,
  // 动作 + 文件类型：发布了通知 / 印发了意见
  /(发布|印发|出台|制定|通过).*?(通知|意见|办法|规定|条例|细则|方案)/,
  // 文号格式：建办城〔2023〕45号
  /\d{4}[】\]〕].*?号/,
  // 书名号引用：《关于...的通知》
  /《[^》]{3,30}》(?:通知|意见|办法|规定|条例|细则|方案)?/,
  // 依据引用：根据...规定 / 按照...政策
  /(根据|依据|按照).*?(规定|政策|文件|通知|意见|办法)/,
  // 明确 + 政策动词
  /(明确|指出|强调|要求).*?(取消|调整|改革|禁止|限制)/,
];

export const HOMOGENEITY_EXPRESSIONS = [
  "普通人一定要知道",
  "看懂这几点",
  "释放了什么信号",
  "影响每一个人",
  "建议收藏",
  "一文看懂",
  "底层逻辑",
  "深度解析",
  "未来趋势",
  "全网首发",
  "刚刚宣布",
  "很多人还不知道",
  "这意味着什么",
];

export const EXAGGERATED_NUMBER_PATTERNS = [
  /\d+%的人不?知道/,
  /\d+%以上/,
  /100%/,
  /所有人/,
  /每个人/,
];

export const INDUCEMENT_WORDS = [
  "关注领取",
  "转发抽奖",
  "点赞送",
  "扫码加",
  "加微信",
  "进群",
  "戳链接",
  "点击领取",
];

export const QUALIFICATION_TOPICS = [
  "医疗",
  "药品",
  "医疗器械",
  "保健食品",
  "投资理财",
  "金融服务",
  "股票",
  "基金",
  "期货",
  "保险",
  "律师",
  "法律",
  "心理咨询",
  "教育",
  "培训",
];

export const PLATFORM_DESCRIPTIONS: Record<string, string> = {
  百家号:
    "百度百家号严格遵循广告法，严禁标题党、绝对化用语和政策误读。对虚假新闻和营销软文打击力度大。",
  今日头条:
    "今日头条对标题党审核极为严格，严厉打击夸张、悬疑、诱导性标题。对低质拼接、无信息增量内容限流明显。",
  微信公众号:
    "公众号对谣言、诱导分享/关注有明确限制。时政类内容需新闻资质，医疗/金融类需相应资质。",
  小红书:
    "小红书严格执行广告法（绝对化用语红线），对医疗/金融/保健等特殊行业限制严格。禁止站外引流，鼓励真实体验分享。",
  知乎:
    "知乎对事实准确性、信息价值要求高，严禁编造故事。医疗/法律/金融等专业建议需资质声明或免责声明。",
};

export const PLATFORM_RULES: PlatformRuleEntry[] = [
  // 标题党规则
  {
    id: "title_bait_exaggerated",
    name: "夸张诱导标题",
    description:
      "标题使用夸张、诱导性词汇（如'震惊''炸了''重大信号''重磅'等），属于平台严厉打击的标题党行为。",
    riskLevel: "高",
    triggerType: "标题党",
    keywords: [
      "重大信号",
      "炸了",
      "惊人",
      "震惊",
      "重磅",
      "曝光",
      "揭秘",
      "紧急",
      "速看",
      "注意了",
      "不看后悔",
    ],
    platforms: ["百家号", "今日头条", "小红书"],
    suggestion: "使用平实、准确的陈述句标题，去掉夸张和诱导性词汇。",
  },
  {
    id: "title_bait_suspense",
    name: "悬念误导标题",
    description:
      "标题使用疑问句制造悬念（如'不拆了？''变天了？'），容易被判定为政策误导或标题党。",
    riskLevel: "高",
    triggerType: "标题党",
    keywords: ["不拆了", "变天"],
    platforms: ["百家号", "今日头条", "知乎"],
    suggestion: "改为陈述句，直接说明事件或现象，避免疑问句制造悬念。",
  },

  // 绝对化用语
  {
    id: "absolute_words_ad_law",
    name: "绝对化用语（广告法）",
    description:
      "使用'最''第一''唯一''绝对''顶级''国家级'等绝对化用语，违反《广告法》第九条，各平台均严格限制。",
    riskLevel: "高",
    triggerType: "绝对化",
    keywords: ABSOLUTE_WORDS,
    platforms: ["百家号", "今日头条", "微信公众号", "小红书", "知乎"],
    suggestion: "加入限定范围，如'较为''部分''之一'等，避免绝对化表述。",
  },

  // 政策误读
  {
    id: "policy_misinterpretation",
    name: "政策引用与误读",
    description:
      "引用政策文件、部门名称但未准确核实，存在歪曲、误读国家政策法规的风险。百家号/头条/小红书对此尤为敏感。",
    riskLevel: "高",
    triggerType: "政策误读",
    keywords: POLICY_KEYWORDS_FOR_RULES,
    platforms: ["百家号", "今日头条", "小红书", "知乎"],
    suggestion: "核实政策原文，补充官方来源链接，避免过度解读。",
  },

  // 虚假数字
  {
    id: "fake_statistics",
    name: "虚假/夸张数据",
    description:
      "使用未经核实的统计数字（如'90%的人不知道''100%'）或夸大比例，属于虚假内容或误导信息。",
    riskLevel: "中",
    triggerType: "虚假数字",
    keywords: ["90%的人不知道", "100%", "所有人", "每个人"],
    platforms: ["百家号", "今日头条", "知乎"],
    suggestion: "补充数据来源，或改为模糊表述如'许多人''大部分'。",
  },

  // 同质化/低质
  {
    id: "homogeneity_template",
    name: "同质化套路表达",
    description:
      "使用'一文看懂''底层逻辑''释放了什么信号'等模板化表达，内容缺乏差异化，易被判定为低质或AI生成。",
    riskLevel: "中",
    triggerType: "同质化",
    keywords: HOMOGENEITY_EXPRESSIONS,
    platforms: ["百家号", "今日头条", "小红书", "知乎"],
    suggestion: "用具体案例、个人观察替代套路化表达，增加信息增量。",
  },

  // 诱导行为
  {
    id: "inducement_behavior",
    name: "诱导关注/分享/引流",
    description:
      "诱导用户关注、转发、扫码加微信、进群等行为。微信公众号和小红书对此限制严格。",
    riskLevel: "高",
    triggerType: "诱导行为",
    keywords: INDUCEMENT_WORDS,
    platforms: ["微信公众号", "小红书", "知乎"],
    suggestion: "删除诱导性表述，内容本身应具备传播价值。",
  },

  // 资质缺失
  {
    id: "qualification_missing",
    name: "特殊行业资质缺失",
    description:
      "涉及医疗、药品、金融投资、法律服务、心理咨询等领域的内容，需具备相应资质或添加免责声明。小红书/知乎对此尤为严格。",
    riskLevel: "高",
    triggerType: "资质缺失",
    keywords: QUALIFICATION_TOPICS,
    platforms: ["小红书", "知乎", "微信公众号"],
    suggestion: "添加'本文不构成专业建议'等免责声明，或删除无资质领域的专业判断。",
  },

  // 营销软文
  {
    id: "hidden_marketing",
    name: "未标注营销软文",
    description:
      "内容具有明显推广、营销性质但未标注'广告'或'合作'，属于违规营销。百家号/头条要求严格。",
    riskLevel: "中",
    triggerType: "营销软文",
    keywords: ["强烈推荐", "必买", "种草", "闭眼入", "无限回购"],
    platforms: ["百家号", "今日头条", "小红书"],
    suggestion: "如为推广内容，需明确标注'广告''合作'' sponsored'等。",
  },
];

export function getRulesForPlatform(platform: Platform): PlatformRuleEntry[] {
  return PLATFORM_RULES.filter((r) => r.platforms.includes(platform));
}
