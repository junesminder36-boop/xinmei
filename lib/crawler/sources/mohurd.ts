import { fetchCheerio, fetchCheerioWithBrowser, randomDelay, normalizeUrl } from "@/lib/crawler/utils/fetch";
import { cleanTitle, parseDateFromText, generateKeywords, extractTextFromHtml } from "@/lib/crawler/utils/parser";
import type { CrawledPolicy } from "@/lib/crawler/pipeline";

const SOURCE_NAME = "住房和城乡建设部";
const BASE_URL = "https://www.mohurd.gov.cn";
const LIST_URL = "https://www.mohurd.gov.cn/gongkai/zhengce/zhengcefilelib/";

/**
 * 抓取住建部政策文件库
 */
export async function crawlMohurd(): Promise<CrawledPolicy[]> {
  const results: CrawledPolicy[] = [];

  try {
    // 住建部有反爬，使用无头浏览器
    const $ = await fetchCheerioWithBrowser(LIST_URL);

    // 尝试多种列表选择器
    const linkSelectors = [
      ".gl_list2 li a",
      ".list li a",
      ".news-list li a",
      ".content a[href*='zhengcefilelib']",
      "a[href*='/t20']", // 住建部详情页通常以 /t2026 开头
    ];

    const links = new Set<string>();
    for (const sel of linkSelectors) {
      $(sel).each((_, el) => {
        const href = $(el).attr("href");
        if (href && (href.includes("t20") || href.includes("content"))) {
          links.add(normalizeUrl(href, BASE_URL));
        }
      });
      if (links.size > 0) break;
    }

    const urls = Array.from(links).slice(0, 20);

    for (const url of urls) {
      try {
        await randomDelay(2000, 4000);
        const policy = await parsePolicyPage(url, true);
        if (policy) results.push(policy);
      } catch (e) {
        console.error(`[mohurd] 抓取详情页失败: ${url}`, e);
      }
    }
  } catch (e) {
    console.error("[mohurd] 抓取列表页失败:", e);
  }

  return results;
}

async function parsePolicyPage(url: string, useBrowser = false): Promise<CrawledPolicy | null> {
  const $ = useBrowser ? await fetchCheerioWithBrowser(url) : await fetchCheerio(url);

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

  let issuer = "住房和城乡建设部";
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
