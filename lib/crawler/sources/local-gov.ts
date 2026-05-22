import { fetchCheerio, randomDelay, normalizeUrl } from "@/lib/crawler/utils/fetch";
import { cleanTitle, parseDateFromText, generateKeywords, extractTextFromHtml } from "@/lib/crawler/utils/parser";
import type { CrawledPolicy } from "@/lib/crawler/pipeline";

export interface LocalGovConfig {
  name: string;
  baseUrl: string;
  listUrl: string;
  listSelectors: string[];
  titleSelectors: string[];
  dateSelectors: string[];
  contentSelectors: string[];
  issuer: string;
}

/**
 * 通用地方政府爬虫
 * 用法：传入配置对象，即可抓取任意地方政府网站
 */
export async function crawlLocalGov(config: LocalGovConfig): Promise<CrawledPolicy[]> {
  const results: CrawledPolicy[] = [];

  try {
    const $ = await fetchCheerio(config.listUrl);

    const links = new Set<string>();
    for (const sel of config.listSelectors) {
      $(sel).each((_, el) => {
        const href = $(el).attr("href");
        if (href && href.length > 5) {
          links.add(normalizeUrl(href, config.baseUrl));
        }
      });
      if (links.size > 0) break;
    }

    const urls = Array.from(links).slice(0, 15);

    for (const url of urls) {
      try {
        await randomDelay(2000, 4000);
        const policy = await parseLocalPolicyPage(url, config);
        if (policy) results.push(policy);
      } catch (e) {
        console.error(`[${config.name}] 抓取详情页失败: ${url}`, e);
      }
    }
  } catch (e) {
    console.error(`[${config.name}] 抓取列表页失败:`, e);
  }

  return results;
}

async function parseLocalPolicyPage(url: string, config: LocalGovConfig): Promise<CrawledPolicy | null> {
  const $ = await fetchCheerio(url);

  let title = "";
  for (const sel of config.titleSelectors) {
    title = $(sel).first().text();
    if (title && title.length >= 5) break;
  }
  title = cleanTitle(title);
  if (!title || title.length < 5) return null;

  let date: string | null = null;
  for (const sel of config.dateSelectors) {
    const text = $(sel).first().text();
    date = parseDateFromText(text);
    if (date) break;
  }

  let contentHtml = "";
  for (const sel of config.contentSelectors) {
    const html = $(sel).html();
    if (html && html.length > 200) {
      contentHtml = html;
      break;
    }
  }

  const content = extractTextFromHtml(contentHtml || $.html());
  if (content.length < 100) return null;

  return {
    title,
    source: config.name,
    issuer: config.issuer,
    issueDate: date || new Date().toISOString().slice(0, 10),
    content: content.slice(0, 8000),
    keywords: generateKeywords(title, content),
    url,
  };
}

// 预置的地方政府配置示例（深圳）
export const SHENZHEN_CONFIG: LocalGovConfig = {
  name: "深圳市人民政府",
  baseUrl: "http://www.sz.gov.cn",
  listUrl: "http://www.sz.gov.cn/cn/xxgk/zfxxgj/yjzj/content/post_11223344.html", // 需替换为实际列表页
  listSelectors: [".news-list li a", ".list li a", "a[href*='content/post_']"],
  titleSelectors: ["h1", ".article-title", "title"],
  dateSelectors: [".article-date", ".time", ".pubtime"],
  contentSelectors: [".view", ".article-content", ".content-detail", ".main"],
  issuer: "深圳市人民政府",
};
