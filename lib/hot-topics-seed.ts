export type HotTopicCategory = "城市更新" | "地产" | "物业";

export interface HotTopic {
  title: string;
  source: string;
  date: string;
  category: HotTopicCategory;
}

export const DEFAULT_HOT_TOPICS: HotTopic[] = [
  // 城市更新
  { title: "城市更新'十五五'规划落地，持有型物业如何抓第一波红利", source: "行业动态", date: "2026-05-20", category: "城市更新" },
  { title: "一线城市写字楼空置率持续承压，运营提效成为资产保值关键", source: "市场观察", date: "2026-05-21", category: "城市更新" },
  { title: "产业园区从'收租模式'向'产业服务商'转型的5个路径", source: "行业研究", date: "2026-05-19", category: "城市更新" },
  { title: "存量商业改造为长租公寓的合规路径与成本测算", source: "投资分析", date: "2026-05-19", category: "城市更新" },
  { title: "混合业态项目的计费难题：7种计费模式怎么选", source: "运营干货", date: "2026-05-19", category: "城市更新" },

  // 地产
  { title: "REITs扩容至消费基础设施，对资管运营提出哪些新要求", source: "资本动态", date: "2026-05-20", category: "地产" },
  { title: "长租公寓品牌分化加剧，精细化运营成决胜关键", source: "市场观察", date: "2026-05-21", category: "地产" },
  { title: "产业园招商难？3个已经被验证的产业链招商打法", source: "招商策略", date: "2026-05-20", category: "地产" },
  { title: "央国企资管平台建设的常见踩坑点与避坑指南", source: "实操经验", date: "2026-05-20", category: "地产" },
  { title: "危旧房改造纳入十五五规划，约50万套改造目标如何落地", source: "政策解读", date: "2026-05-22", category: "地产" },

  // 物业
  { title: "物业企业数字化降本增效的3个抓手：人效、能耗、收缴率", source: "运营干货", date: "2026-05-22", category: "物业" },
  { title: "物业多种经营收入占比突破30%，头部物企做对了什么", source: "行业研究", date: "2026-05-19", category: "物业" },
  { title: "智慧社区国标升级，'卓越级'认证背后的技术路径", source: "技术趋势", date: "2026-05-22", category: "物业" },
  { title: "物业收缴率从75%提升到95%，这家企业做了四件事", source: "案例拆解", date: "2026-05-21", category: "物业" },
  { title: "AI+物业：从概念到落地的3个真实应用场景", source: "技术趋势", date: "2026-05-22", category: "物业" },
  { title: "物业项目经理的一天：数字化工具如何节省3小时", source: "人物故事", date: "2026-05-21", category: "物业" },
];
