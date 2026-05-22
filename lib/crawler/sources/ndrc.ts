import { fetchCheerio, randomDelay, normalizeUrl } from "@/lib/crawler/utils/fetch";
import { cleanTitle, parseDateFromText, generateKeywords, extractTextFromHtml } from "@/lib/crawler/utils/parser";
import type { CrawledPolicy } from "@/lib/crawler/pipeline";

const SOURCE_NAME = "国家发展和改革委员会";
const BASE_URL = "https://www.ndrc.gov.cn";
const LIST_URL = "https://www.ndrc.gov.cn/xxgk/zcfb/tz/";

/**
 * 抓取国家发改委政策通知
 */
export async function crawlNdrc(): Promise<CrawledPolicy[]> {
  const results: CrawledPolicy[] = [];

  try {
    const $ = await fetchCheerio(LIST_URL);

    // 国家发改委通知列表页链接格式：./202605/t20260520_1405333.html
    // 过滤掉 ../../jd/ 开头的解读/答记者问类文章
    const links = new Set<string>();
    $("a[href^='./20']").each((_, el) => {
      const href = $(el).attr("href");
      if (href && href.includes("t20")) {
        links.add(normalizeUrl(href, LIST_URL));
      }
    });
    // 备用选择器
    if (links.size === 0) {
      $(".u-list li a, .list li a, .news-list li a").each((_, el) => {
        const href = $(el).attr("href");
        if (href && href.startsWith("./20") && href.includes("t20")) {
          links.add(normalizeUrl(href, LIST_URL));
        }
      });
    }

    const urls = Array.from(links).slice(0, 20);

    for (const url of urls) {
      try {
        await randomDelay(2000, 4000);
        const policy = await parsePolicyPage(url);
        if (policy) results.push(policy);
      } catch (e) {
        console.error(`[ndrc] 抓取详情页失败: ${url}`, e);
      }
    }
  } catch (e) {
    console.error("[ndrc] 抓取列表页失败:", e);
  }

  return results;
}

async function parsePolicyPage(url: string): Promise<CrawledPolicy | null> {
  const $ = await fetchCheerio(url);

  let title =
    $("h1").first().text() ||
    $(".article-title").first().text() ||
    $("title").text() ||
    "";
  title = cleanTitle(title);
  if (!title || title.length < 5) return null;

  let date: string | null = null;
  const dateSelectors = [".article-date", ".pages-date", ".time", ".pubtime"];
  for (const sel of dateSelectors) {
    const text = $(sel).first().text();
    date = parseDateFromText(text);
    if (date) break;
  }

  let issuer = "国家发展和改革委员会";
  const sourceSelectors = [".article-source", ".source", ".dept"];
  for (const sel of sourceSelectors) {
    const text = $(sel).first().text();
    if (text && text.length > 2 && text.length < 30) {
      issuer = text.replace(/来源[：:]/, "").trim() || issuer;
      break;
    }
  }

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
    content: content.slice(0, 8000),
    keywords: generateKeywords(title, content),
    url,
  };
}
