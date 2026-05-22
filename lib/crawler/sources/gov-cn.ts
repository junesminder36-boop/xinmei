import { fetchCheerio, fetchCheerioWithBrowser, randomDelay, normalizeUrl } from "@/lib/crawler/utils/fetch";
import { cleanTitle, parseDateFromText, generateKeywords, extractTextFromHtml } from "@/lib/crawler/utils/parser";
import type { CrawledPolicy } from "@/lib/crawler/pipeline";

const SOURCE_NAME = "中国政府网";
const BASE_URL = "http://www.gov.cn";

// 入口页面：政策文件库按年份分类
const ENTRY_PAGES = [
  "http://www.gov.cn/zhengce/content/2026-01/01/content_6910000.htm", // 2026年示例，实际需调整
];

/**
 * 抓取中国政府网政策文件
 * 说明：由于 gov.cn 政策库首页为搜索形式，这里采用抓取"最新政策"列表页的方式。
 * 实际运行时需根据页面结构调整 listSelectors。
 */
export async function crawlGovCn(): Promise<CrawledPolicy[]> {
  const results: CrawledPolicy[] = [];

  try {
    // 中国政府网有严格反爬，使用无头浏览器获取
    const $ = await fetchCheerioWithBrowser("https://www.gov.cn/zhengce/zhengceku/");

    // 常见选择器尝试：列表中的政策链接
    const linkSelectors = [
      ".news_list li a",
      ".list li a",
      ".zhengce_list li a",
      ".content a[href*='/content_']",
      ".main a[href*='/content_']",
      "a[href*='zhengce/content']",
    ];

    const links = new Set<string>();
    for (const sel of linkSelectors) {
      $(sel).each((_, el) => {
        const href = $(el).attr("href");
        if (href && href.includes("content_")) {
          links.add(normalizeUrl(href, BASE_URL));
        }
      });
      if (links.size > 0) break;
    }

    const urls = Array.from(links).slice(0, 20); // 每次最多抓20条

    for (const url of urls) {
      try {
        await randomDelay(2000, 4000);
        const policy = await parsePolicyPage(url, true);
        if (policy) results.push(policy);
      } catch (e) {
        console.error(`[gov.cn] 抓取详情页失败: ${url}`, e);
      }
    }
  } catch (e) {
    console.error("[gov.cn] 抓取列表页失败:", e);
  }

  return results;
}

async function parsePolicyPage(url: string, useBrowser = false): Promise<CrawledPolicy | null> {
  const $ = useBrowser ? await fetchCheerioWithBrowser(url) : await fetchCheerio(url);

  // 标题选择器（按优先级尝试）
  let title =
    $("h1").first().text() ||
    $(".article-title").first().text() ||
    $("title").text() ||
    "";
  title = cleanTitle(title);
  if (!title || title.length < 5) return null;

  // 发布日期
  let date: string | null = null;
  const dateSelectors = [
    ".article-date",
    ".pages-date",
    ".time",
    ".pubtime",
    ".source",
  ];
  for (const sel of dateSelectors) {
    const text = $(sel).first().text();
    date = parseDateFromText(text);
    if (date) break;
  }

  // 来源/发布机构
  let issuer = "国务院";
  const sourceSelectors = [".article-source", ".source", ".issuer", ".dept"];
  for (const sel of sourceSelectors) {
    const text = $(sel).first().text();
    if (text && text.length > 2 && text.length < 30) {
      issuer = text.replace(/来源[：:]/, "").trim() || issuer;
      break;
    }
  }

  // 正文
  let contentHtml = "";
  const contentSelectors = [
    ".view",
    ".article-content",
    ".content-detail",
    ".pages_content",
    "#UCAP-CONTENT",
    ".main",
  ];
  for (const sel of contentSelectors) {
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
    source: SOURCE_NAME,
    issuer,
    issueDate: date || new Date().toISOString().slice(0, 10),
    content: content.slice(0, 8000), // 限制长度
    keywords: generateKeywords(title, content),
    url,
  };
}
