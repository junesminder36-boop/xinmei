// 行业最新数据（需定期更新，当前截至 2025 年底）
// 数据来源：国家统计局、住建部、新华社等权威渠道

export const INDUSTRY_DATA = {
  urbanRenewal: {
    // 城镇老旧小区改造
    oldCommunityRenovation: {
      // 2025 年年度数据（国家统计局 2026-02-28 发布）
      annual2025: {
        newStarted: "2.71万个", // 原计划2.5万个，超额完成
        householdsBenefited: "499万户",
        investment: "1332亿元",
        elevatorsAdded: "1.4万部",
        pocketParks: "4700多个",
        greenways: "5800多公里",
        undergroundPipes: "15.6万公里",
      },
      // "十四五"期间累计（2021-2025）
      during14thFiveYearPlan: {
        totalRenovated: "24万多个",
        householdsBenefited: "4000多万户",
        peopleBenefited: "1.1亿人",
        elevatorsAdded: "12.9万部",
        parkingSpacesAdded: "340多万个",
        communityFacilities: "6.4万—7.8万个", // 养老、托育等
        undergroundPipesUpdated: "84万公里",
      },
      // 2019年以来累计（截至2024年底）
      cumulativeSince2019: {
        totalStarted: "28万个",
        householdsBenefited: "4800万户",
        peopleBenefited: "超1.2亿人",
      },
      // 2026年方向
      direction2026: {
        focus: "精细化推进，消除安全隐患，改善居住条件和生活环境",
        scopeExpansion:
          "2000年底前建成的改造任务进入收尾阶段，逐步将2000年底后、2005年底前建成的住宅小区纳入改造范围",
        keyAreas:
          "完整社区建设、口袋公园、绿地开放共享、温暖工程、城市小微公共空间改造、无障碍适老化环境",
      },
    },

    // 城市更新整体投资
    cityUpdateInvestment: {
      total2021to2024: "16.6万亿元",
      annualAverageDuring15thFiveYearPlan: "近9000亿元", // 预计
    },

    // 危旧房改造（十五五规划相关）
    dilapidatedHousing: {
      targetDuring15thFiveYearPlan: "约50万套",
      oldCommunities: "约11.5万个",
      oldBlocksAndFactories: "约1500个",
    },
  },
};

export const URBAN_RENEWAL_DATA_PROMPT = `
【最新行业数据（截至2025年底）】

城镇老旧小区改造：
- 2025年新开工改造城镇老旧小区2.71万个（超额完成原定2.5万个目标），惠及居民499万户，完成投资1332亿元。
- "十四五"期间（2021-2025年）全国累计改造城镇老旧小区24万多个，惠及居民4000多万户、约1.1亿人；加装电梯12.9万部，增设停车位340多万个，建设养老托育等社区服务设施6.4万—7.8万个，更新改造地下管网84万公里。
- 2019年以来累计开工改造城镇老旧小区28万个，惠及居民约4800万户、超1.2亿人。

城市更新投资：
- 2021-2024年城市更新总投资累计达16.6万亿元，预计"十五五"期间年均投资近9000亿元。

2026年工作方向：
- 2000年底前建成的老旧小区改造任务进入收尾阶段，后续将逐步把2000年底后、2005年底前建成的住宅小区纳入改造范围（结合地方财政承受能力）。
- 重点推进：完整社区建设、口袋公园、绿地开放共享、"温暖工程"、城市小微公共空间改造、无障碍适老化环境品质提升。
- 危旧房改造目标：约50万套，老旧小区约11.5万个，老旧街区厂区约1500个；同步推进地下管网智慧化改造。
`;
