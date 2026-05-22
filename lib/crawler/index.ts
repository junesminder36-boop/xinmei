import { crawlGovCn } from "@/lib/crawler/sources/gov-cn";
import { crawlMohurd } from "@/lib/crawler/sources/mohurd";
import { crawlNdrc } from "@/lib/crawler/sources/ndrc";
import { crawlLocalGov, SHENZHEN_CONFIG } from "@/lib/crawler/sources/local-gov";
import {
  saveCrawledPolicies,
  startCrawlLog,
  finishCrawlLog,
  getCrawlLogs,
} from "@/lib/crawler/pipeline";

export type CrawlerSource = "gov-cn" | "mohurd" | "ndrc" | "local" | "all";

const SOURCE_MAP: Record<string, () => Promise<import("@/lib/crawler/pipeline").CrawledPolicy[]>> = {
  "gov-cn": crawlGovCn,
  mohurd: crawlMohurd,
  ndrc: crawlNdrc,
  local: () => crawlLocalGov(SHENZHEN_CONFIG),
};

export async function runCrawler(source: CrawlerSource = "all") {
  const sources = source === "all" ? Object.keys(SOURCE_MAP) : [source];
  const summary: Array<{ source: string; found: number; saved: number; failed: number; error?: string }> = [];

  for (const key of sources) {
    const crawlFn = SOURCE_MAP[key];
    if (!crawlFn) {
      summary.push({ source: key, found: 0, saved: 0, failed: 0, error: "未知的抓取源" });
      continue;
    }

    const logId = startCrawlLog(key);
    let found = 0;
    let saved = 0;
    let failed = 0;
    let errorMsg = "";

    try {
      const policies = await crawlFn();
      found = policies.length;
      saved = saveCrawledPolicies(policies);
      finishCrawlLog(logId, saved > 0 ? "success" : "partial", found, saved, failed, errorMsg || undefined);
    } catch (e) {
      failed = 1;
      errorMsg = e instanceof Error ? e.message : String(e);
      finishCrawlLog(logId, "failed", found, saved, failed, errorMsg);
    }

    summary.push({ source: key, found, saved, failed, error: errorMsg || undefined });
    console.log(`[crawler] ${key}: found=${found}, saved=${saved}, failed=${failed}`);
  }

  return summary;
}

export { getCrawlLogs };
