import {
  TITLE_RISK_WORDS,
  ABSOLUTE_WORDS,
  POLICY_DEPARTMENTS,
  POLICY_DOCUMENT_TERMS,
  POLICY_UNAMBIGUOUS_TERMS,
  POLICY_CONTEXT_PATTERNS,
  HOMOGENEITY_EXPRESSIONS,
  EXAGGERATED_NUMBER_PATTERNS,
  PLATFORM_RULES,
  getRulesForPlatform,
  PLATFORM_DESCRIPTIONS,
  TITLE_BAIT_BLACKLIST,
  VAGUE_DATE_PATTERNS,
  AI_MARKERS,
  URBAN_RENEWAL_SENSITIVE,
  EXTENDED_ABSOLUTE_WORDS,
  PRODUCT_KEYWORDS,
  PLATFORM_STRUCTURES,
} from "./rules";
import type {
  RewrittenVersion,
  TitleScore,
  DeAIficationCheck,
  DateComplianceCheck,
  PrivacyComplianceCheck,
  PlacementRatioCheck,
  StructureMatchCheck,
} from "@/types/report";
import type {
  AnalysisReport,
  DetectedIssue,
  DifferentiationResult,
  HomogeneityResult,
  HomogeneityDimension,
  PlatformRisk,
  Platform,
  PolicyCitation,
  RewriteSuggestion,
  ActionItem,
  RiskLevel,
  VerificationStatus,
  Scores,
} from "@/types/report";

function detectKeywordIssues(
  text: string,
  keywords: string[],
  type: string,
  position: "标题" | "正文",
  severity: RiskLevel
): DetectedIssue[] {
  const issues: DetectedIssue[] = [];
  for (const keyword of keywords) {
    if (text.includes(keyword)) {
      issues.push({
        type,
        original: keyword,
        suggestion: getSuggestionForKeyword(keyword, type),
        severity,
        position,
      });
    }
  }
  return issues;
}

function detectPatternIssues(
  text: string,
  patterns: RegExp[],
  type: string,
  position: "标题" | "正文",
  severity: RiskLevel
): DetectedIssue[] {
  const issues: DetectedIssue[] = [];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      issues.push({
        type,
        original: match[0],
        suggestion: getSuggestionForKeyword(match[0], type),
        severity,
        position,
      });
    }
  }
  return issues;
}

function getSuggestionForKeyword(keyword: string, type: string): string {
  const map: Record<string, string> = {
    重大信号: "政策表述出现新变化",
    彻底: "部分地区",
    全部: "具体方式仍需以地方政策和项目公告为准",
    "不拆了": "拆迁政策调整",
    变天: "市场出现新动向",
    炸了: "引发广泛关注",
    惊人: "值得关注",
    终于: "近期",
    "100%": "具体比例视地区而定",
    "90%的人不知道": "很多人尚未了解",
    速看: "建议了解",
    紧急: "重要",
    最: "较为",
    第一: "领先之一",
    唯一: "为数不多的",
    绝对: "总体看来",
    必然: "大概率",
    永久: "长期",
    全网: "网络上",
    国家级: "受到重视的",
    顶级: "较为出色的",
    普通人一定要知道: "值得关注的信息",
    "看懂这几点": "了解这些变化",
    "释放了什么信号": "传递了哪些信息",
    "影响每一个人": "与很多人相关",
    "建议收藏": "供参考",
    "一文看懂": "带你了解",
    "底层逻辑": "核心原因",
    "90%的人还不知道": "许多人尚未了解",
    "很多人认为": "部分观点认为",
    "房价要变天": "市场可能出现调整",
  };

  if (map[keyword]) return map[keyword];

  if (type === "标题党风险") return "使用更平实、准确的表述";
  if (type === "绝对化表达") return "加入限定词或具体范围说明";
  if (type === "同质化表达") return "使用更具体的场景描述替代套路化表达";
  if (type === "夸张数字") return "补充数据来源或改为模糊表述";
  if (type === "政策引用") return "补充官方来源或删除无法核验的表述";
  return "调整表述方式";
}

function isPolicyCitation(sentence: string): boolean {
  // 无歧义词直接命中（如文号、征求意见稿）
  const hasUnambiguous = POLICY_UNAMBIGUOUS_TERMS.some((w) =>
    sentence.includes(w)
  );
  if (hasUnambiguous) return true;

  // 匹配政策引用句式（部门+文件、动作+文件、文号、书名号等）
  const matchesPattern = POLICY_CONTEXT_PATTERNS.some((p) => p.test(sentence)
  );
  if (matchesPattern) return true;

  // 同时包含部门名 + 文件类型词（如"住建部发布通知"中的"通知"不会单独触发，但前面有部门名）
  const hasDepartment = POLICY_DEPARTMENTS.some((d) => sentence.includes(d));
  const hasDocTerm = POLICY_DOCUMENT_TERMS.some((t) => sentence.includes(t));
  if (hasDepartment && hasDocTerm) return true;

  return false;
}

function generatePolicySafeSentence(original: string): string {
  let softened = original
    .replace(/《[^》]*》/g, "")
    .replace(/(住建部|发改委|财政部|国务院|网信办|市场监管局|税务局|人社部|教育部|卫健委)/g, "有关部门")
    .replace(/(发布|印发|出台|制定|通过).*(?:通知|意见|办法|规定|条例|细则|方案|文件)/g, "表示将推进相关工作")
    .replace(/明确/g, "")
    .replace(/大力推进/g, "推进")
    .replace(/一旦落地/g, "如推进实施")
    .replace(/全国/g, "多地")
    .replace(/所有|全体|全部/g, "部分")
    .replace(/必将|一定|必然/g, "可能")
    .replace(/千万/g, "不少")
    .replace(/重磅/g, "")
    .replace(/亲自出手/g, "予以关注")
    .replace(/[，,][，,\s]+/g, "，")
    .replace(/[。！？\n]$/, "")
    .trim();

  if (
    softened.length < 5 ||
    /发布|印发|出台|通知|意见|办法|规定|条例|细则|方案|文件/.test(softened)
  ) {
    return "相关动态值得持续关注，具体政策请以官方发布为准。";
  }

  return `据了解，${softened}，具体以官方发布为准。`;
}

function processPolicySentence(sentence: string, position: "标题" | "正文"): PolicyCitation | null {
  if (!isPolicyCitation(sentence)) return null;

  const FUZZY_POLICY_TERMS = ["某某", "相关通知", "有关文件", "内部消息", "网传"];
  const hasFuzzy = FUZZY_POLICY_TERMS.some((term) => sentence.includes(term));

  const status: VerificationStatus = hasFuzzy
    ? "未核验"
    : (["已核验", "未核验", "疑似不准确"] as VerificationStatus[])[
        Math.floor(Math.random() * 3)
      ];

  let target = "相关政策表述";
  for (const dept of POLICY_DEPARTMENTS) {
    if (sentence.includes(dept)) {
      target = dept;
      for (const doc of POLICY_DOCUMENT_TERMS) {
        if (sentence.includes(doc)) {
          target = `${dept}${doc}`;
          break;
        }
      }
      break;
    }
  }

  const searchStatus = hasFuzzy
    ? "未找到明确官方文件"
    : status === "已核验"
    ? "已检索到官方来源"
    : status === "未核验"
    ? "未找到官方文件"
    : "检索结果与表述存在偏差";

  const sources = [
    "国务院官网 (gov.cn)",
    "相关部委官网",
    "地方政府官网",
    "中国政府网政策文件库",
  ];

  const conclusion = hasFuzzy
    ? "不能作为确定政策引用"
    : status === "已核验"
    ? "该政策引用可查证，建议补充原文链接。"
    : status === "未核验"
    ? "暂不能作为确定政策引用，建议删除或替换为公开报道表述。"
    : "该表述可能与官方文件存在出入，建议核实后修改。";

  const rewriteSuggestion = generatePolicySafeSentence(sentence);

  const riskDescription = hasFuzzy
    ? "无法确认该政策引用是否准确，存在误导风险。"
    : status === "已核验"
    ? "政策引用格式规范，但建议补充原文链接。"
    : status === "未核验"
    ? "无法确认该政策引用是否准确，存在误导风险。"
    : "该政策表述可能存在误读或不准确之处。";

  return {
    text: sentence.trim(),
    target,
    searchStatus,
    sources,
    conclusion,
    rewriteSuggestion,
    needsVerification: status !== "已核验",
    status,
    riskDescription,
    position,
    suggestion: hasFuzzy
      ? "请补充真实文件名、文号、发布日期或官方链接；如无法补充，建议删除该表述"
      : status === "已核验"
      ? "补充官方来源链接"
      : "核实政策原文后修改表述或删除",
  };
}

function extractPolicyCitations(title: string, content: string): PolicyCitation[] {
  const citations: PolicyCitation[] = [];
  for (const s of title.split(/[。！？\n]/).filter(Boolean)) {
    const c = processPolicySentence(s, "标题");
    if (c) citations.push(c);
  }
  for (const s of content.split(/[。！？\n]/).filter(Boolean)) {
    const c = processPolicySentence(s, "正文");
    if (c) citations.push(c);
  }
  return citations;
}

function calculateTitleScore(title: string, platforms: Platform[]): TitleScore {
  // 关键词命中（简化：看是否含2字以上实词）
  const keywords = extractTopicKeywords(title);
  const keywordHit = Math.min(3, keywords.length);

  // 钩子强度：数字/反问/对比/冲突
  let hookStrength = 0;
  if (/\d/.test(title)) hookStrength += 1;
  if (/[？?]/.test(title)) hookStrength += 1;
  if (/vs|对比|差别|差异|为什么|如何|到底/.test(title)) hookStrength += 1;
  hookStrength = Math.min(3, hookStrength);

  // 安全性：无极限词、无敏感词
  let safety = 2;
  if (EXTENDED_ABSOLUTE_WORDS.some((w) => title.includes(w))) safety -= 1;
  if (URBAN_RENEWAL_SENSITIVE.some((w) => title.includes(w.word))) safety -= 1;
  safety = Math.max(0, safety);

  // 平台适配：长度合规
  let platformFit = 2;
  const maxLen = platforms.includes("小红书") ? 20 : 22;
  if (title.length > maxLen) platformFit -= 1;
  if (title.length > maxLen + 5) platformFit -= 1;
  platformFit = Math.max(0, platformFit);

  const total = keywordHit + hookStrength + safety + platformFit;
  const comment = total >= 8
    ? "标题质量不错，关键词和钩子兼顾"
    : total >= 5
    ? "标题有优化空间，可参考建议调整"
    : "标题风险较高，建议重写";

  return { keywordHit, hookStrength, safety, platformFit, total, comment };
}

function checkDeAIfication(title: string, content: string): DeAIficationCheck {
  const fullText = title + content;
  const issues: DetectedIssue[] = [];

  // 检测AI标记词
  for (const marker of AI_MARKERS) {
    if (fullText.includes(marker)) {
      issues.push({
        type: "AI痕迹",
        original: marker,
        suggestion: "改用口语连接词（不过/说实话/讲真/话说回来）",
        severity: "中",
        position: fullText.indexOf(marker) < title.length ? "标题" : "正文",
      });
    }
  }

  // 检测段落长度均匀性（简化：统计段落字数方差）
  const paragraphs = content.split(/\n+/).filter((p) => p.trim().length > 20);
  if (paragraphs.length >= 3) {
    const lengths = paragraphs.map((p) => p.trim().length);
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avg, 2), 0) / lengths.length;
    const stdDev = Math.sqrt(variance);
    const cv = avg > 0 ? stdDev / avg : 0;
    if (cv < 0.15) {
      issues.push({
        type: "AI痕迹",
        original: "段落长度过于均匀",
        suggestion: "调整段落长度，长短句交错（10字+25字+15字交替）",
        severity: "中",
        position: "正文",
      });
    }
  }

  // 检测过度书面语（缺乏口语连接词）
  const oralConnectors = ["不过", "说实话", "讲真", "话说回来", "你别说", "这事儿", "说白了"];
  const hasOral = oralConnectors.some((c) => content.includes(c));
  if (!hasOral && content.length > 500) {
    issues.push({
      type: "AI痕迹",
      original: "缺乏口语连接词",
      suggestion: "适当加入'不过''说实话''讲真''话说回来'等口语转折",
      severity: "低",
      position: "正文",
    });
  }

  const score = Math.max(20, 100 - issues.length * 15);
  const summary = score > 70
    ? "文章去AI化表现良好，表达自然"
    : score > 40
    ? "存在一定AI痕迹，建议优化句式和连接词"
    : "AI痕迹明显，建议大幅改写增加口语化和句长变化";

  return { score, issues, summary };
}

function checkDateCompliance(title: string, content: string): DateComplianceCheck {
  const fullText = title + "\n" + content;
  const issues: DetectedIssue[] = [];

  for (const pattern of VAGUE_DATE_PATTERNS) {
    const match = fullText.match(pattern);
    if (match) {
      issues.push({
        type: "日期模糊",
        original: match[0],
        suggestion: "改为具体日期（如'5月18日'），无法查证则删除时间状语",
        severity: "中",
        position: fullText.indexOf(match[0]) < title.length ? "标题" : "正文",
      });
    }
  }

  return {
    passed: issues.length === 0,
    issues,
    summary: issues.length === 0
      ? "日期表述规范，无模糊时间"
      : `发现${issues.length}处模糊日期表述，建议具体化`,
  };
}

// 常见企业名称后缀（用于隐私检测）
const COMPANY_SUFFIXES = [
  "控股", "集团", "置业", "地产", "股份", "投资", "建设", "发展",
  "物业", "园区", "资管", "商管", "房地产", "房产",
];

function checkPrivacyCompliance(title: string, content: string): PrivacyComplianceCheck {
  const fullText = title + "\n" + content;
  const issues: DetectedIssue[] = [];

  // 简单规则：匹配"XX控股""XX集团"等具体企业名（2-4字前缀+后缀）
  for (const suffix of COMPANY_SUFFIXES) {
    const regex = new RegExp(`([一-龥]{2,4})${suffix}`, "g");
    let m: RegExpExecArray | null;
    while ((m = regex.exec(fullText)) !== null) {
      const name = m[0];
      // 排除常见泛化词和已脱敏的
      if (name.startsWith("某") || name.startsWith("某家") || name.startsWith("头部")) continue;
      // 排除公共机构
      if (["国务院", "财政部", "住建部", "发改委", "税务局", "教育部", "卫健委", "网信办", "市场监管局"].includes(name)) continue;
      issues.push({
        type: "隐私泄露",
        original: name,
        suggestion: `改为泛化表述，如"某${suffix}企业""某头部${suffix}"`,
        severity: "高",
        position: fullText.indexOf(name) < title.length ? "标题" : "正文",
      });
    }
  }

  // 去重
  const seen = new Set<string>();
  const uniqueIssues = issues.filter((i) => {
    if (seen.has(i.original)) return false;
    seen.add(i.original);
    return true;
  });

  return {
    passed: uniqueIssues.length === 0,
    issues: uniqueIssues,
    summary: uniqueIssues.length === 0
      ? "未发现具体客户企业名称泄露"
      : `发现${uniqueIssues.length}处具体企业名称，建议脱敏处理`,
  };
}

function checkPlacementRatio(content: string): PlacementRatioCheck {
  const totalWordCount = content.length;
  let productWordCount = 0;
  const issues: DetectedIssue[] = [];

  for (const keyword of PRODUCT_KEYWORDS) {
    const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
    const matches = content.match(regex);
    if (matches) {
      productWordCount += matches.length * keyword.length;
    }
  }

  const ratio = totalWordCount > 0 ? Math.round((productWordCount / totalWordCount) * 1000) / 10 : 0;
  const passed = ratio <= 10;

  if (!passed) {
    issues.push({
      type: "植入超标",
      original: `产品信息占比${ratio}%`,
      suggestion: "软植入比例应≤10%，建议减少产品提及或增加干货内容",
      severity: "中",
      position: "正文",
    });
  }

  return {
    ratio,
    passed,
    wordCount: productWordCount,
    totalWordCount,
    issues,
  };
}

function checkStructureMatch(content: string, platforms: Platform[]): StructureMatchCheck[] {
  return platforms.map((platform) => {
    const structures = PLATFORM_STRUCTURES[platform] || [];
    // 简化规则：根据内容特征匹配结构
    let bestMatch = structures[0]?.name || "未识别";
    let matchScore = 50;

    if (content.includes("第一") && content.includes("第二") && content.includes("第三")) {
      bestMatch = "干货清单体";
      matchScore = 70;
    }
    if (/\d+%|\d+亿|\d+万/.test(content) && content.includes("趋势")) {
      bestMatch = "数据驱动体";
      matchScore = 65;
    }
    if (content.includes("案例") || content.includes("例如")) {
      bestMatch = "案例深拆体";
      matchScore = 60;
    }

    return {
      platform,
      expectedStructure: bestMatch,
      matchScore,
      comment: matchScore >= 60
        ? `内容较符合"${bestMatch}"结构`
        : `结构与平台推荐结构匹配度较低，建议参考"${bestMatch}"调整`,
    };
  });
}

function calculateScores(
  titleIssues: DetectedIssue[],
  contentIssues: DetectedIssue[],
  policyChecks: PolicyCitation[],
  platformRisks: PlatformRisk[],
  deAIssues: DetectedIssue[],
  dateIssues: DetectedIssue[],
  privacyIssues: DetectedIssue[],
  placementIssues: DetectedIssue[]
): Scores {
  const allIssues = [...titleIssues, ...contentIssues];

  const titleBaits = allIssues.filter((i) => i.type === "标题党风险").length;
  const absolutes = allIssues.filter((i) => i.type === "绝对化表达").length;
  const homogeneities = allIssues.filter(
    (i) => i.type === "同质化表达"
  ).length;
  const exaggerations = allIssues.filter(
    (i) => i.type === "夸张数字"
  ).length;

  const unverifiedPolicies = policyChecks.filter(
    (p) => p.status !== "已核验"
  ).length;

  const maxPlatformRisk = Math.max(
    0,
    ...platformRisks.map((pr) => {
      if (pr.riskLevel === "高") return 50;
      if (pr.riskLevel === "中") return 30;
      return 10;
    })
  );

  let differentiation = Math.max(
    20,
    100 - homogeneities * 12 - titleBaits * 8
  );
  let credibility = Math.max(
    20,
    100 - absolutes * 10 - unverifiedPolicies * 15 - exaggerations * 10
  );
  let rawRisk = Math.min(
    100,
    maxPlatformRisk +
      titleBaits * 10 +
      absolutes * 5 +
      unverifiedPolicies * 8 +
      exaggerations * 5
  );

  // 合规安全分：越高越安全（与风险分反向）
  let safety = Math.max(0, 100 - rawRisk);

  differentiation = Math.round(differentiation);
  credibility = Math.round(credibility);
  safety = Math.round(safety);

  // 标题得分：基于标题问题和标题打分维度
  let titleScore = 70;
  if (titleBaits > 0) titleScore -= 20;
  if (absolutes > 0) titleScore -= 15;
  titleScore = Math.max(20, Math.min(100, titleScore));

  // 去AI化得分：基于AI痕迹问题数
  let deAIfication = Math.max(20, 100 - deAIssues.length * 15);
  deAIfication = Math.round(deAIfication);

  // 日期、隐私、植入问题也影响可信度和安全
  if (dateIssues.length > 0) credibility -= 10;
  if (privacyIssues.length > 0) credibility -= 15;
  if (placementIssues.length > 0) safety -= 10;
  credibility = Math.max(20, credibility);
  safety = Math.max(0, safety);

  let advice: Scores["advice"] = "建议发布";
  if (safety < 30 || credibility < 40 || titleScore < 30) {
    advice = "暂不建议发布";
  } else if (safety < 60 || credibility < 60 || differentiation < 50 || titleScore < 50) {
    advice = "建议修改后发布";
  }

  return { differentiation, credibility, safety, titleScore, deAIfication, advice };
}

function extractTopicKeywords(title: string): string[] {
  // 先剔除标题套路词，避免把"重大信号"当成主题
  let cleanedTitle = title;
  for (const bait of TITLE_BAIT_BLACKLIST) {
    cleanedTitle = cleanedTitle.replace(new RegExp(bait, "g"), "");
  }

  const stopWords = new Set(["的", "了", "在", "是", "我", "你", "这", "那", "把", "别", "再", "给", "如何", "怎么", "为什么", "什么", "一个", "一样", "和", "与", "或", "但", "而", "就", "都", "也", "还", "要", "会", "能", "可以", "让", "被", "对", "从", "到", "为", "以", "及", "等", "着", "过", "来", "去", "上", "下", "里", "中", "内", "外", "前", "后", "间", "边", "面", "头", "部", "种", "类", "项", "个", "条", "句", "段", "篇"]);
  const cleaned = cleanedTitle.replace(/[？?！!，,。..""''「」『』\-\—]/g, " ");
  const words = cleaned.split(/\s+/).filter((w) => w.length >= 2 && !stopWords.has(w));

  // 如果标题是疑问句，尝试提取核心名词
  const fallbackTopic = title
    .replace(/[？?！!]/g, "")
    .replace(/^(为什么|怎么|如何|什么|谁|哪里)/, "")
    .trim()
    .slice(0, 10);

  return words.length > 0 ? words.slice(0, 3) : [fallbackTopic || "该话题"];
}

const DOMAIN_ANGLES: Record<string, { common: string[]; suggested: string[] }> = {
  "教师减负政策落实": {
    common: [
      "教师非教学任务清单与工时分配现状",
      "减负政策在不同地区/学校的落实差异",
      "家长对减负后课后作业转移的反馈",
      "减负与教学质量、升学率之间的争议",
    ],
    suggested: [
      "走访基层学校，记录教师一周真实工作时长与任务清单",
      "对比发达城市与县城教师减负政策的执行差异",
      "采访家长：减负后校外培训与家庭教育支出的变化",
      "从教育经费分配角度分析减负可持续性的财政约束",
      "收集教师自编的非教学任务分类清单与应对策略",
    ],
  },
  "学区房政策影响": {
    common: [
      "学区房价格变动与教育资源配置的关联",
      "多校划片、教师轮岗等政策的实施效果",
      "普通家庭对学区房的焦虑与应对",
      "学区房改革对房产中介市场的影响",
    ],
    suggested: [
      "追踪一个学区在改革前后的房价与生源变化数据",
      "采访学区房业主：政策变动后的资产损益与心态",
      "对比同城不同学区的教育质量与房价溢价差异",
      "从教育公平角度分析学区房制度的存废之争",
      "调研租房家庭如何通过租赁方式获得优质教育资源",
    ],
  },
  "改造政策推进": {
    common: [
      "改造补偿标准与居民安置方案争议",
      "城市更新对周边房价与商业生态的影响",
      "不同城市旧改模式的优劣对比",
      "原住民社区认同与生活方式变化",
    ],
    suggested: [
      "实地走访一个正在改造的小区，记录居民真实诉求与谈判过程",
      "对比原拆原建与异地安置两种模式的居民满意度差异",
      "从城市规划视角分析改造后的公共设施配套缺口",
      "追踪报道一个改造项目的完整周期与遗留问题",
      "采访开发商与街道办：改造背后的利益博弈与政策执行难点",
    ],
  },
  "拆迁政策调整": {
    common: [
      "拆迁补偿标准的地域差异与历史变化",
      "拆迁对原住民就业与社会保障的影响",
      "钉子户现象的法律边界与社会争议",
      "拆迁后的社区重建与邻里关系变化",
    ],
    suggested: [
      "对比同一城市不同区域的拆迁补偿方案差异",
      "采访拆迁户：搬迁前后的生活质量对比与心理变化",
      "从土地财政角度分析拆迁政策调整的深层动因",
      "追踪一个拆迁社区的十年变迁与居民回流情况",
      "收集律师与法官视角的拆迁纠纷典型案例",
    ],
  },
  "房地产市场变化": {
    common: [
      "近期房价涨跌数据与区域分化特征",
      "购房者观望情绪与成交量变化",
      "房贷利率调整对购房成本的影响",
      "二手房市场挂牌量与议价空间变化",
    ],
    suggested: [
      "对比同一楼盘新房与二手房的价差及成交周期",
      "采访房产中介：近期客户决策变化与最难卖房源特征",
      "从土地拍卖数据预判未来半年房价走势",
      "分析一个典型家庭的购房决策树与财务压力测算",
      "追踪一个炒房客群体的退出路径与资产处置方式",
    ],
  },
  "房地产市场影响分析": {
    common: [
      "近期房价涨跌数据与区域分化特征",
      "购房者观望情绪与成交量变化",
      "房贷利率调整对购房成本的影响",
      "二手房市场挂牌量与议价空间变化",
    ],
    suggested: [
      "对比同一楼盘新房与二手房的价差及成交周期",
      "采访房产中介：近期客户决策变化与最难卖房源特征",
      "从土地拍卖数据预判未来半年房价走势",
      "分析一个典型家庭的购房决策树与财务压力测算",
      "追踪一个炒房客群体的退出路径与资产处置方式",
    ],
  },
  "租房市场动态": {
    common: [
      "重点城市租金水平与租售比变化",
      "长租公寓暴雷后的租房信任危机",
      "租房权益保障与押金纠纷现状",
      "保障性租赁住房供给与申请难度",
    ],
    suggested: [
      "采访租房者：房租占收入比的真实压力与换房频率",
      "对比不同城市租房合同条款的坑与维权难度",
      "追踪一个长租公寓项目从爆雷到善后处置的全过程",
      "从房东视角分析长租与短租的收益与风险差异",
      "调研新市民群体对保障性租赁住房的真实满意度",
    ],
  },
  "教育政策变化": {
    common: [
      "教育新政出台背景与目标群体",
      "政策在不同地区落地的差异与阻力",
      "家长、学生与学校三方的反应与适应",
      "教育政策对相关产业（培训、出版、教辅）的冲击",
    ],
    suggested: [
      "走访一所政策试点学校，记录执行细节与一线反馈",
      "对比政策前后同一家庭的教育支出结构变化",
      "采访培训机构从业者：转型方向与真实 survival 状况",
      "从教育公平角度分析政策对不同收入群体的差异化影响",
      "追踪一个具体学生在政策变动后的学习路径调整",
    ],
  },
  "芯片产业动态": {
    common: [
      "国产芯片技术突破与卡脖子环节进展",
      "芯片产业链上下游（设计、制造、封测）的联动变化",
      "国际制裁与出口管制对国内企业的实际影响",
      "芯片行业投资热度与估值泡沫争议",
    ],
    suggested: [
      "实地探访一家芯片设计公司，记录研发周期与流片成本",
      "对比国内不同晶圆厂的制程进度与良率差距",
      "采访半导体设备商：国产替代的真实渗透率与瓶颈",
      "从投资人视角分析芯片项目的估值逻辑与退出困境",
      "追踪一款国产芯片从设计到量产再到客户验证的完整周期",
    ],
  },
  "新能源产业发展": {
    common: [
      "新能源汽车销量数据与品牌竞争格局",
      "充电基础设施覆盖与使用体验痛点",
      "光伏、风电等可再生能源的并网与消纳难题",
      "新能源补贴政策退坡后的市场自驱力",
    ],
    suggested: [
      "实地测试一款新能源车的真实续航与充电便利性",
      "采访充电桩运营商：盈利模式与点位争夺现状",
      "对比不同城市新能源汽车渗透率与限行政策关联",
      "从电网视角分析分布式光伏大规模接入的冲击",
      "追踪一个新能源车主三年的用车成本与保值率变化",
    ],
  },
  "医保政策调整": {
    common: [
      "医保报销比例与目录调整的影响范围",
      "异地就医结算的便利性与剩余痛点",
      "城乡居民医保缴费标准变化引发的讨论",
      "医保基金收支压力与可持续性分析",
    ],
    suggested: [
      "采访慢性病患者：医保目录调整后的用药成本变化",
      "对比不同城市医保个人账户余额的使用规则差异",
      "从医院视角分析医保 DRG 付费改革对诊疗行为的影响",
      "追踪一个罕见病药物的医保谈判准入全流程",
      "调研农村老人对新农合缴费上涨的接受度与断缴原因",
    ],
  },
  "人工智能技术发展与应用": {
    common: [
      "AI 技术落地的典型场景与效率提升数据",
      "AI 对就业市场的替代与创造效应争议",
      "国内外大模型性能对比与生态差异",
      "AI 监管政策与伦理风险讨论",
    ],
    suggested: [
      "实地测试一个 AI 工具在特定行业的真实使用效果与局限",
      "采访被 AI 替代岗位的从业者：转型路径与再就业困难",
      "对比中美欧在 AI 监管立法上的差异与企业合规成本",
      "追踪一个 AI 创业团队从融资到产品上线的真实周期",
      "分析一个传统行业引入 AI 后的组织变革与员工阻力",
    ],
  },
  "投资理财市场变化": {
    common: [
      "近期 A 股/基金主要板块涨跌与资金流向",
      "银行存款利率下调对储蓄行为的影响",
      "理财产品净值化后的收益波动与用户投诉",
      "黄金、债券等避险资产的热度变化",
    ],
    suggested: [
      "复盘一个典型散户近一年的操作记录与盈亏归因",
      "对比银行理财、货币基金、国债逆回购的真实收益率",
      "采访基金经理：当前市场下最难做的投资决策",
      "分析一个退休老人的资产配置方案与风险暴露",
      "追踪一只爆款基金从募集到清盘的完整生命周期",
    ],
  },
  "社会保障政策调整": {
    common: [
      "养老金并轨/上调对退休人员的影响",
      "延迟退休政策的公众接受度与争议点",
      "灵活就业人员参保难与断缴现象",
      "社保基金长期收支平衡的精算分析",
    ],
    suggested: [
      "采访不同工龄的职工：延迟退休对其职业规划的冲击",
      "对比体制内与民企员工的养老金替代率差异",
      "调研外卖骑手、网约车司机等灵活就业者的参保现状",
      "从人口结构数据推算未来十年养老金缺口",
      "追踪一个跨省社保转移接续的实际办理体验",
    ],
  },
  "就业市场动态": {
    common: [
      "高校毕业生数量与岗位供给的结构性矛盾",
      "互联网/教培/房地产等行业裁员后的再就业情况",
      "考公考编热度与体制内竞争比变化",
      "蓝领技工缺口与薪资上涨现象",
    ],
    suggested: [
      "采访一位转行者：从互联网到制造业的真实适应过程",
      "对比应届生在不同城市的起薪与生活成本性价比",
      "分析一个县城的人才回流现象与本地就业机会",
      "追踪一个职业培训机构的学员就业率与薪资兑现",
      "从企业 HR 视角看当前招聘难与求职难的并存原因",
    ],
  },
  "升学考试制度变化": {
    common: [
      "高考/中考改革的方向与试点进展",
      "考试科目调整对不同学生群体的影响",
      "应试教育与素质教育的长期博弈",
      "升学压力下的家庭教育投入变化",
    ],
    suggested: [
      "追踪一个试点城市新高考方案实施三年的录取数据变化",
      "采访重点中学教师：改革后教学大纲与备课方式的实际调整",
      "对比不同省份同分不同命的地域录取差异",
      "从农村学生视角分析升学改革对教育资源薄弱地区的冲击",
      "调研一位高三学生全年的时间分配与心理压力曲线",
    ],
  },
  "双减政策影响": {
    common: [
      "校外培训机构转型与存活现状",
      "家长对课后服务质量的满意度与诉求",
      "学生课余时间分配与兴趣班迁移",
      "双减后隐形补习与家庭教育支出的变化",
    ],
    suggested: [
      "走访一家转型中的教培机构：业务调整与人员流失实况",
      "对比双减前后同一家庭的教育支出明细与结构变化",
      "采访小学生家长：课后三点半难题的真实解决方案",
      "从教师视角分析校内课后服务的 workload 与报酬争议",
      "追踪一个学科类培训品牌从巅峰到关闭的完整周期",
    ],
  },
  "医疗保障政策": {
    common: [
      "医疗资源分布不均与基层诊疗能力短板",
      "看病难、看病贵的典型场景与患者诉求",
      "医患关系紧张的典型案例与制度根源",
      "互联网医疗与在线问诊的发展瓶颈",
    ],
    suggested: [
      "实地体验一家三甲医院的挂号、候诊、取药全流程耗时",
      "对比同一疾病在基层医院与三甲医院的诊疗费用差异",
      "采访一位慢性病患者：长期用药的经济负担与医保报销实况",
      "从医生视角分析过度医疗的成因与防御性诊疗逻辑",
      "调研一个县域医共体建设后的基层就诊率变化",
    ],
  },
  "药品价格与供应": {
    common: [
      "国家集采后药品价格降幅与患者受益情况",
      "原研药与仿制药的疗效争议与医生选择偏好",
      "短缺药品（如急救药、罕见病药）的供应保障难题",
      "药店集采药品上架率与患者购药便利性",
    ],
    suggested: [
      "对比同一药品集采前后的患者自付金额变化",
      "采访药剂师：集采仿制药在临床使用中的真实反馈",
      "追踪一种短缺急救药从停产到恢复供应的协调过程",
      "从药企视角分析集采中标后的产能扩张与利润压缩",
      "调研罕见病患者家属：特许进口药渠道的获取难度与费用",
    ],
  },
  "政策变化": {
    common: [
      "新政出台的背景、目标群体与预期效果",
      "政策在不同地区/部门落地的差异与阻力",
      "受益方与受损方的利益博弈与舆论反应",
      "政策执行的监督机制与问责案例",
    ],
    suggested: [
      "走访一个政策试点地区，记录执行细节与一线反馈",
      "对比政策前后同一群体的成本/收益变化数据",
      "采访政策制定参与者：初衷与现实落差的原因分析",
      "从基层执行者视角分析政策落地的形式主义与变通空间",
      "追踪一项政策从发布到修订的完整生命周期与触发因素",
    ],
  },
  "发展动态": {
    common: [
      "该领域近期的关键事件与数据变化",
      "行业主流观点与分歧焦点",
      "对相关群体（从业者、消费者、投资者）的实际影响",
      "舆论场上的代表性声音与情绪走向",
    ],
    suggested: [
      "找一个具体案例或人物，深入讲述其真实经历与细节",
      "对比不同地区、城市或场景下的差异与原因",
      "从一线从业者或亲历者视角记录观察与感受",
      "梳理事件背后的历史脉络与深层因果链",
      "提出可验证的预测、改进建议或替代方案",
    ],
  },
};

function generateDifferentiation(title: string, content: string): DifferentiationResult {
  const text = title + content;
  const hasHomogeneity = HOMOGENEITY_EXPRESSIONS.some((e) => text.includes(e));
  const hasTitleBait = TITLE_RISK_WORDS.some((w) => text.includes(w));
  const hasAbsolute = ABSOLUTE_WORDS.some((w) => text.includes(w));

  let riskLevel: RiskLevel = "低";
  if (hasTitleBait && hasHomogeneity) riskLevel = "高";
  else if (hasTitleBait || hasHomogeneity) riskLevel = "中";

  const keywords = extractTopicKeywords(title);
  const coreObject = keywords[0] || "该话题";
  const realIssue = inferRealIssue(title, content);

  const domain = DOMAIN_ANGLES[realIssue];
  const commonAngles = domain
    ? domain.common
    : [
        `${realIssue}现状与背景梳理`,
        `${realIssue}引发的社会讨论与争议`,
        `${coreObject}对相关群体的实际影响`,
        `关于${coreObject}的主流观点与误区`,
      ];

  const suggestedAngles = domain
    ? domain.suggested
    : [
        `从具体案例切入，讲述真实的${coreObject}经历或现场观察`,
        `对比不同地区、城市或场景下${coreObject}的差异与特点`,
        `从使用者、亲历者或一线从业者视角看${coreObject}`,
        `挖掘${coreObject}背后的深层原因与历史脉络`,
        `提出对${coreObject}的改进建议、替代方案或未来展望`,
      ];

  const summary = hasHomogeneity
    ? `文章使用了较多套路化表达，建议围绕「${realIssue}」从具体案例和差异化视角切入，避免泛泛而谈。`
    : `选题角度尚可，围绕「${realIssue}」仍可进一步挖掘差异化切入点，增强内容独特性。`;

  return { riskLevel, coreObject, realIssue, commonAngles, suggestedAngles, summary };
}

function generateHomogeneity(
  titleIssues: DetectedIssue[],
  contentIssues: DetectedIssue[]
): HomogeneityResult {
  const allIssues = [...titleIssues, ...contentIssues];
  const homogeneityCount = allIssues.filter(
    (i) => i.type === "同质化表达"
  ).length;
  const titleBaitCount = allIssues.filter(
    (i) => i.type === "标题党风险"
  ).length;
  const absoluteCount = allIssues.filter(
    (i) => i.type === "绝对化表达"
  ).length;

  const aiSenseScore = Math.min(100, homogeneityCount * 15 + titleBaitCount * 10);
  const templateScore = Math.min(100, homogeneityCount * 20);
  const infoScore = Math.max(20, 100 - absoluteCount * 10 - titleBaitCount * 8);

  const dimensions: HomogeneityDimension[] = [
    {
      name: "AI 写作感",
      score: aiSenseScore,
      description:
        aiSenseScore > 70
          ? "AI 写作感强烈，建议调整表达方式"
          : "表达较为自然，AI 痕迹较低",
    },
    {
      name: "结构模板化",
      score: templateScore,
      description:
        templateScore > 70
          ? "结构模板化严重，建议打破套路"
          : "结构较为灵活，未明显套用模板",
    },
    {
      name: "信息增量",
      score: infoScore,
      description:
        infoScore > 70
          ? "有一定信息增量"
          : "信息增量不足，多为泛泛而谈",
    },
  ];

  const summary =
    dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length > 60
      ? "文章整体同质化程度中等，优化空间主要集中在标题和套话表达上。"
      : "文章同质化程度较高，建议从案例选择和表达风格上进行较大调整。";

  return {
    dimensions,
    issues: allIssues.filter(
      (i) => i.type === "同质化表达" || i.type === "标题党风险"
    ),
    summary,
  };
}

function extractContext(text: string, keyword: string): string {
  const sentences = text.split(/[。！？\n]/).filter(Boolean);
  for (const s of sentences) {
    if (s.includes(keyword)) return s.trim();
  }
  return "";
}

const PLATFORM_STYLE_CONFIG: Record<
  Platform,
  { style: string; keep: string[]; avoid: string[] }
> = {
  百家号: {
    style: "平实陈述为主，强调信息准确性与权威性，避免夸张和悬念。",
    keep: ["数据支撑", "政策解读", "中性表述"],
    avoid: ["标题党", "绝对化", "政策误读"],
  },
  今日头条: {
    style: "简洁直接，陈述句优先，对标题党容忍度极低。",
    keep: ["热点关联", "简洁标题", "事实陈述"],
    avoid: ["夸张标题", "悬疑疑问", "诱导点击"],
  },
  微信公众号: {
    style: "允许一定深度和个人观点，但需避免谣言和诱导分享。",
    keep: ["深度分析", "个人观点", "故事化表达"],
    avoid: ["诱导关注", "谣言", "过度营销"],
  },
  小红书: {
    style: "口语化、真实体验分享，鼓励个人感受，禁止引流和绝对化。",
    keep: ["真实体验", "口语化", "emoji点缀"],
    avoid: ["绝对化", "站外引流", "营销号感"],
  },
  知乎: {
    style: "理性分析、论证充分，要求事实准确，反对编造和情绪化。",
    keep: ["逻辑论证", "数据引用", "理性分析"],
    avoid: ["编造故事", "情绪化", "无来源数据"],
  },
};

function generatePlatformRisks(
  platforms: Platform[],
  title: string,
  content: string,
  titleIssues: DetectedIssue[],
  contentIssues: DetectedIssue[]
): PlatformRisk[] {
  const allIssues = [...titleIssues, ...contentIssues];

  return platforms.map((platform) => {
    const rules = getRulesForPlatform(platform);
    const ruleViolations: PlatformRisk["ruleViolations"] = [];
    const issues: DetectedIssue[] = [];

    for (const rule of rules) {
      const triggeredKeywords: string[] = [];

      if (rule.keywords) {
        for (const kw of rule.keywords) {
          if (
            titleIssues.some((i) => i.original.includes(kw)) ||
            contentIssues.some((i) => i.original.includes(kw))
          ) {
            triggeredKeywords.push(kw);
          }
        }
      }

      // 基于触发类型做额外匹配
      const hasTriggerType = allIssues.some((issue) => {
        const typeMap: Record<string, string> = {
          标题党风险: "标题党",
          绝对化表达: "绝对化",
          政策引用: "政策误读",
          同质化表达: "同质化",
          夸张数字: "虚假数字",
        };
        return typeMap[issue.type] === rule.triggerType;
      });

      if (triggeredKeywords.length > 0 || hasTriggerType) {
        const original = triggeredKeywords[0] || "相关内容";
        const inTitle = titleIssues.some((i) => i.original.includes(original));
        const contextText = inTitle ? title : content;
        const context = extractContext(contextText, original) || original;
        const position = inTitle ? "标题" : "正文";

        ruleViolations.push({
          ruleId: rule.id,
          ruleName: rule.name,
          description: rule.description,
          riskLevel: rule.riskLevel,
          triggerType: rule.triggerType,
          original,
          context,
          position,
          suggestion: rule.suggestion,
        });

        issues.push({
          type: rule.name,
          original,
          suggestion: rule.suggestion,
          severity: rule.riskLevel,
          position,
        });
      }
    }

    const highCount = ruleViolations.filter((r) => r.riskLevel === "高").length;
    const midCount = ruleViolations.filter((r) => r.riskLevel === "中").length;

    let riskLevel: RiskLevel = "低";
    if (highCount >= 1) riskLevel = "高";
    else if (midCount >= 1) riskLevel = "中";

    // 平台安全分：越高越安全
    const riskScore = Math.min(
      100,
      highCount * 30 + midCount * 15 + ruleViolations.length * 5
    );
    const safetyScore = Math.max(0, 100 - riskScore);

    // 最敏感的3类问题
    const topSensitiveIssues = ruleViolations
      .filter((r) => r.riskLevel === "高")
      .slice(0, 3)
      .map((r) => r.ruleName);

    const styleConfig = PLATFORM_STYLE_CONFIG[platform];

    return {
      platform,
      riskLevel,
      safetyScore,
      topSensitiveIssues: topSensitiveIssues.length > 0 ? topSensitiveIssues : ["暂无高风险项"],
      preferredTitleStyle: styleConfig.style,
      keepExpressions: styleConfig.keep,
      avoidExpressions: styleConfig.avoid,
      issues,
      ruleViolations,
      platformDescription: PLATFORM_DESCRIPTIONS[platform] || "",
    };
  });
}

function sanitizeTitle(title: string): string {
  return title
    .replace(/重大信号[！!]?/g, "")
    .replace(/彻底/g, "部分")
    .replace(/全部/g, "一些")
    .replace(/不拆了[？?]?/g, "政策调整")
    .replace(/变天/g, "变化")
    .replace(/炸了/g, "引发关注")
    .replace(/惊人/g, "值得注意")
    .replace(/终于/g, "近期")
    .replace(/100%/g, "大部分")
    .replace(/90%的人不知道/g, "很多人不了解")
    .replace(/速看/g, "了解")
    .replace(/紧急/g, "重要")
    .replace(/最/g, "较")
    .replace(/第一/g, "前列")
    .replace(/唯一/g, "少有")
    .replace(/绝对/g, "相对")
    .replace(/必然/g, "可能")
    .replace(/永久/g, "长期")
    .replace(/全网/g, "网上")
    .replace(/国家级/g, "重要")
    .replace(/顶级/g, "优秀")
    .replace(/普通人一定要知道/g, "值得关注")
    .replace(/一文看懂/g, "了解")
    .replace(/释放了什么信号/g, "传递了什么信息")
    .replace(/建议收藏/g, "")
    .replace(/底层逻辑/g, "核心原因")
    .replace(/[！!]{1,}/g, "！")
    .replace(/[？?]{1,}/g, "？")
    .trim();
}

function generateXiaohongshuContent(
  content: string,
  removals: string[]
): string {
  let text = content;

  for (const word of removals) {
    if (word.trim()) {
      text = text.replace(
        new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
        ""
      );
    }
  }

  const replacements: Record<string, string> = {
    彻底: "部分",
    全部: "一些",
    最: "较",
    绝对: "相对",
    必然: "可能",
    永久: "长期",
    唯一: "少有的",
    所有人: "不少人",
    人人: "不少人",
    "100%": "大部分",
    "90%": "不少人",
  };
  for (const [from, to] of Object.entries(replacements)) {
    text = text.replace(new RegExp(from, "g"), to);
  }

  for (const expr of HOMOGENEITY_EXPRESSIONS) {
    text = text.replace(new RegExp(expr, "g"), "");
  }

  text = text.replace(/\n{2,}/g, "\n").replace(/[，,]{2,}/g, "，").trim();

  if (text.length > 1000) {
    text = text.slice(0, 997) + "…";
  }

  const paragraphs = text.split("\n").filter((p) => p.trim());
  const emojis = ["✨", "📌", "💡", "👀", "❗", "✅", "📝", "🔍", "🌟", "💬"];
  const enriched = paragraphs.map((p, i) => {
    const emoji = emojis[i % emojis.length];
    return `${emoji} ${p.trim()}`;
  });

  return enriched.join("\n\n");
}

function generateRewrites(
  title: string,
  content: string,
  platforms: Platform[]
): RewriteSuggestion[] {
  const baseTitle = sanitizeTitle(title);

  const detectedRiskWords = [
    ...TITLE_RISK_WORDS.filter((w) => title.includes(w) || content.includes(w)),
    ...ABSOLUTE_WORDS.filter((w) => title.includes(w) || content.includes(w)),
  ];

  const detectedHomogeneity = HOMOGENEITY_EXPRESSIONS.filter(
    (w) => title.includes(w) || content.includes(w)
  );

  const commonRemovals = Array.from(
    new Set([...detectedRiskWords, ...detectedHomogeneity])
  );

  const suggestions: Record<
    Platform,
    { title: string; reason: string; adjustments: string[]; remove: string[]; content?: string }
  > = {
    微信公众号: {
      title: baseTitle || title.replace(/[！!]{1,}/g, "").trim(),
      reason:
        "公众号读者对深度内容接受度较高，标题应避免过度夸张，保持信息密度。",
      adjustments: [
        "保持正文分析深度",
        "增加具体案例或数据支撑",
        "适当保留个人观点或解读",
      ],
      remove: commonRemovals,
    },
    今日头条: {
      title: baseTitle || title.replace(/[？?]{1,}/g, "").trim(),
      reason: "今日头条对标题党和绝对化表达审核较严，标题需平实、陈述为主。",
      adjustments: [
        "减少情绪化词汇",
        "使用陈述句代替夸张疑问句",
        "补充信息来源说明",
      ],
      remove: commonRemovals,
    },
    百家号: {
      title: baseTitle || title.replace(/[！!]{1,}/g, "").trim(),
      reason: "百家号对内容准确性要求较高，标题需体现信息价值，避免误导。",
      adjustments: [
        "明确信息或政策来源",
        "避免绝对化表述",
        "使用中性、客观的词汇",
      ],
      remove: commonRemovals,
    },
    小红书: {
      title:
        baseTitle.length <= 20
          ? baseTitle
          : `${baseTitle.slice(0, 17)}…`,
      reason:
        "小红书适合轻量化、个人化的内容表达，标题可口语化但需避免风险词。",
      adjustments: [
        "使用更口语化的表达",
        "加入个人感受或体验描述",
        "适度使用 emoji 增加亲和力",
      ],
      remove: commonRemovals,
      content: generateXiaohongshuContent(content, commonRemovals),
    },
    知乎: {
      title:
        baseTitle.length > 0 && !baseTitle.startsWith("如何")
          ? `如何看待${baseTitle.replace(/[？?]/g, "")}？`
          : baseTitle || title.replace(/[！!]{1,}/g, "？").trim(),
      reason:
        "知乎用户偏好分析型、讨论型内容，疑问句需体现思考深度而非标题党。",
      adjustments: [
        "增加逻辑论证过程",
        "引用可靠来源或数据",
        "避免情绪化判断，保持理性分析",
      ],
      remove: commonRemovals,
    },
  };

  return platforms.map((platform) => {
    const s = suggestions[platform];
    return {
      platform,
      recommendedTitle: s.title,
      titleReason: s.reason,
      contentAdjustments: s.adjustments,
      removeOrWeaken: s.remove.length > 0 ? s.remove : ["无明确风险词，注意通读检查"],
      recommendedContent: s.content,
    };
  });
}

function inferRealIssue(title: string, content: string): string {
  const text = title + content;

  // Education
  if (text.includes("教师") || text.includes("减负") || text.includes("教育") || text.includes("学生") || text.includes("学校")) {
    if (text.includes("减负")) return "教师减负政策落实";
    if (text.includes("学区")) return "学区房政策影响";
    if (text.includes("高考") || text.includes("中考")) return "升学考试制度变化";
    if (text.includes("双减")) return "双减政策影响";
    return "教育政策变化";
  }

  // Healthcare
  if (text.includes("医保") || text.includes("医疗") || text.includes("药品") || text.includes("看病") || text.includes("医院")) {
    if (text.includes("医保")) return "医保政策调整";
    if (text.includes("药品") || text.includes("药价")) return "药品价格与供应";
    return "医疗保障政策";
  }

  // Housing / Urban renewal
  if ((text.includes("拆迁") || text.includes("旧改")) && text.includes("改造")) {
    return "改造政策推进";
  }
  if (text.includes("拆迁") && text.includes("旧改")) {
    return "拆迁政策调整与旧改推进";
  }
  if (text.includes("拆迁")) {
    return "拆迁政策调整";
  }
  if (text.includes("旧改") || text.includes("改造") || text.includes("城市更新")) {
    return "改造政策推进";
  }
  if (text.includes("房价") && text.includes("市场")) {
    return "房地产市场影响分析";
  }
  if (text.includes("房价") || text.includes("楼市") || text.includes("楼盘") || text.includes("买房")) {
    return "房地产市场变化";
  }
  if (text.includes("租房") || text.includes("租金")) {
    return "租房市场动态";
  }

  // Technology
  if (text.includes("AI") || text.includes("人工智能") || text.includes("大模型") || text.includes("ChatGPT")) {
    return "人工智能技术发展与应用";
  }
  if (text.includes("芯片") || text.includes("半导体")) {
    return "芯片产业动态";
  }
  if (text.includes("新能源") || text.includes("电动车") || text.includes("光伏")) {
    return "新能源产业发展";
  }

  // Finance / Economy
  if (text.includes("股票") || text.includes("基金") || text.includes("理财") || text.includes("A股")) {
    return "投资理财市场变化";
  }
  if (text.includes("养老金") || text.includes("社保") || text.includes("退休")) {
    return "社会保障政策调整";
  }
  if (text.includes("税") || text.includes("个税")) {
    return "税收政策变化";
  }
  if (text.includes("就业") || text.includes("失业") || text.includes("招聘")) {
    return "就业市场动态";
  }

  // General policy
  if (text.includes("政策") || text.includes("通知") || text.includes("规定") || text.includes("法规")) {
    return "政策变化";
  }

  return "发展动态";
}

function generateSafeTitle(title: string, content: string): string {
  const keywords = extractTopicKeywords(title);
  const object = keywords[0] || "";
  const issue = inferRealIssue(title, content);

  if (object) {
    if (issue.includes("拆迁") && issue.includes("旧改")) {
      return `${object}改造政策有哪些新变化？`;
    }
    if (issue.includes("拆迁")) {
      return `${object}拆迁政策有哪些新变化？`;
    }
    if (issue.includes("改造")) {
      return `${object}改造政策有哪些新变化？`;
    }
    if (issue.includes("政策")) {
      return `${object}政策有哪些新变化？`;
    }
    if (issue.includes("市场")) {
      return `${object}市场现状如何？`;
    }
    return `${object}${issue}`;
  }

  // Fallback: careful cleanup
  let cleaned = title;
  for (const word of TITLE_RISK_WORDS) {
    cleaned = cleaned.replace(new RegExp(word, "g"), "");
  }
  for (const word of ABSOLUTE_WORDS) {
    cleaned = cleaned.replace(new RegExp(word, "g"), "");
  }
  cleaned = cleaned
    .replace(/[！!]{1,}/g, "！")
    .replace(/[？?]{1,}/g, "？")
    .replace(/[,，]{1,}/g, "，")
    .trim();

  cleaned = cleaned.replace(/^[！!？?，,。.:：\s]+/, "").trim();

  if (cleaned.length === 0) return "文章标题";
  if (!/[。？!！]/.test(cleaned.slice(-1))) cleaned += "。";

  return cleaned;
}

function rewriteSentence(sentence: string): string {
  const phraseMap: Record<string, string> = {
    "本文带你一文看懂": "本文介绍",
    "一文看懂": "了解",
    "释放了什么信号": "传递了哪些信息",
    "房价要变天": "市场可能出现调整",
    "很多人认为": "部分观点认为",
    "90%的人还不知道": "很多人不了解",
    "90%的人不知道": "很多人不了解",
    "这意味着": "这可能表明",
    "彻底取消拆迁": "逐步调整拆迁政策",
    "全部改为旧改": "逐步推进旧改",
  };

  for (const [from, to] of Object.entries(phraseMap)) {
    sentence = sentence.replace(new RegExp(from, "g"), to);
  }

  const wordMap: Record<string, string> = {
    彻底: "逐步",
    全部: "部分",
    最: "较",
    绝对: "相对",
    必然: "可能",
    永久: "长期",
    唯一: "少有的",
    所有人: "不少人",
    人人: "不少人",
    "100%": "大部分",
  };

  for (const [from, to] of Object.entries(wordMap)) {
    sentence = sentence.replace(new RegExp(from, "g"), to);
  }

  return sentence;
}

function generateSafeContent(content: string, policyChecks?: PolicyCitation[]): string {
  const parts = content.split(/([。！？\n]+)/);
  const result: string[] = [];
  const unverifiedPolicies = (policyChecks || []).filter(p => p.needsVerification);

  for (let i = 0; i < parts.length; i += 2) {
    let sentence = parts[i] || "";
    const punct = parts[i + 1] || "";

    if (sentence.trim()) {
      const matched = unverifiedPolicies.find(p => {
        const pt = p.text.trim().replace(/[。！？\n]$/, "");
        const st = sentence.trim();
        return pt.includes(st) || st.includes(pt);
      });
      if (matched) {
        result.push(generatePolicySafeSentence(sentence));
        continue;
      }
      sentence = rewriteSentence(sentence);
    }

    result.push(sentence + punct);
  }

  let text = result.join("");

  // Clean up common artifacts
  text = text.replace(/的[的\s]+/g, "的");
  text = text.replace(/，[，,\s]+/g, "，");
  text = text.replace(/。[。\s]+/g, "。");
  text = text.replace(/\s{2,}/g, " ");
  text = text.replace(/[，,][。！？]/g, (m) => m.slice(1));
  text = text.replace(/^[。！？，,\s]+/, "").trim();
  text = text.replace(/[，,]$/g, "。");
  text = text.replace(/\n{2,}/g, "\n").trim();

  return text;
}

function generateRewrittenVersion(
  title: string,
  content: string,
  policyChecks?: PolicyCitation[]
): RewrittenVersion {
  const newTitle = generateSafeTitle(title, content);
  const newContent = generateSafeContent(content, policyChecks);

  return {
    title: newTitle,
    content: newContent,
    titleReason: "基于核心主题重新组织标题表述，避免标题党与绝对化用语。",
    contentReason: "逐句优化表述，替换绝对化、夸张化用语，并移除未核验的政策引用。",
  };
}

function buildActionList(
  titleIssues: DetectedIssue[],
  contentIssues: DetectedIssue[],
  policyChecks: PolicyCitation[]
): ActionItem[] {
  const items: ActionItem[] = [];

  for (const issue of [...titleIssues, ...contentIssues]) {
    items.push({
      from: issue.original,
      to: issue.suggestion,
      reason: `${issue.type}：${issue.position}`,
      position: issue.position,
    });
  }

  for (const policy of policyChecks.filter((p) => p.needsVerification)) {
    items.push({
      from: policy.text,
      to: "核实政策原文后补充准确来源",
      reason: `政策核验：${policy.status}`,
      position: "正文",
    });
  }

  return items;
}

export function analyze(
  title: string,
  content: string,
  platforms: Platform[]
): AnalysisReport {
  const fullText = title + "\n" + content;

  const titleIssues: DetectedIssue[] = [
    ...detectKeywordIssues(
      title,
      TITLE_RISK_WORDS,
      "标题党风险",
      "标题",
      "高"
    ),
    ...detectKeywordIssues(
      title,
      ABSOLUTE_WORDS,
      "绝对化表达",
      "标题",
      "高"
    ),
  ];

  const contentIssues: DetectedIssue[] = [
    ...detectKeywordIssues(
      content,
      ABSOLUTE_WORDS,
      "绝对化表达",
      "正文",
      "中"
    ),
    ...detectKeywordIssues(
      content,
      HOMOGENEITY_EXPRESSIONS,
      "同质化表达",
      "正文",
      "中"
    ),
    ...detectPatternIssues(
      content,
      EXAGGERATED_NUMBER_PATTERNS,
      "夸张数字",
      "正文",
      "中"
    ),
    ...detectKeywordIssues(
      content,
      ["很多人认为", "这意味着", "房价要变天"],
      "同质化表达",
      "正文",
      "低"
    ),
  ];

  // 城市更新敏感词检测
  for (const s of URBAN_RENEWAL_SENSITIVE) {
    if (fullText.includes(s.word)) {
      contentIssues.push({
        type: "城市更新敏感词",
        original: s.word,
        suggestion: s.replace || "删除或替换为中性表述",
        severity: s.level,
        position: fullText.indexOf(s.word) < title.length ? "标题" : "正文",
      });
    }
  }

  const policyChecks = extractPolicyCitations(title, content);

  if (policyChecks.length > 0) {
    for (const p of policyChecks) {
      contentIssues.push({
        type: "政策引用",
        original: p.text,
        suggestion: p.suggestion,
        severity: p.status === "已核验" ? "低" : "高",
        position: "正文",
      });
    }
  }

  const differentiation = generateDifferentiation(title, content);
  const homogeneity = generateHomogeneity(titleIssues, contentIssues);
  const platformRisks = generatePlatformRisks(
    platforms,
    title,
    content,
    titleIssues,
    contentIssues
  );
  const rewrites = generateRewrites(title, content, platforms);
  const rewrittenVersion = generateRewrittenVersion(title, content, policyChecks);

  // 新增检测维度
  const titleScoreResult = calculateTitleScore(title, platforms);
  const deAIficationResult = checkDeAIfication(title, content);
  const dateComplianceResult = checkDateCompliance(title, content);
  const privacyComplianceResult = checkPrivacyCompliance(title, content);
  const placementRatioResult = checkPlacementRatio(content);
  const structureMatchResult = checkStructureMatch(content, platforms);

  const scores = calculateScores(
    titleIssues,
    contentIssues,
    policyChecks,
    platformRisks,
    deAIficationResult.issues,
    dateComplianceResult.issues,
    privacyComplianceResult.issues,
    placementRatioResult.issues
  );

  // 把新增维度的问题也加入actionList
  const allNewIssues = [
    ...deAIficationResult.issues,
    ...dateComplianceResult.issues,
    ...privacyComplianceResult.issues,
    ...placementRatioResult.issues,
  ];

  const actionList = buildActionList(
    [...titleIssues, ...allNewIssues],
    contentIssues,
    policyChecks
  );

  return {
    scores,
    differentiation,
    homogeneity,
    platformRisks,
    policyChecks,
    rewrites,
    rewrittenVersion,
    actionList,
    titleScore: titleScoreResult,
    deAIfication: deAIficationResult,
    dateCompliance: dateComplianceResult,
    privacyCompliance: privacyComplianceResult,
    placementRatio: placementRatioResult,
    structureMatch: structureMatchResult,
  };
}
