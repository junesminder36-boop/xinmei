import * as cheerio from "cheerio";

export function extractTextFromHtml(html: string): string {
  const $ = cheerio.load(html);
  // 移除 script, style, nav, header, footer
  $("script, style, nav, header, footer, iframe, .share, .print, .bdshare").remove();
  let text = $("body").text();
  // 清理多余空白
  text = text
    .replace(/\n\s*\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
  return text;
}

export function cleanTitle(title: string): string {
  return title
    .replace(/\s+/g, " ")
    .replace(/-_中国政府网$/, "")
    .replace(/-_住房城乡建设部$/, "")
    .replace(/-_国家发展和改革委员会$/, "")
    .replace(/【(.+)】-国家发展和改革委员会/, "$1")
    .replace(/【(.+)】-国务院/, "$1")
    .replace(/【(.+)】-住房和城乡建设部/, "$1")
    .trim();
}

export function parseDateFromText(text: string): string | null {
  // 匹配常见日期格式：2024-01-15、2024年01月15日、2024/01/15
  const patterns = [
    /(\d{4})[年/-](\d{1,2})[月/-](\d{1,2})[日]?/,
    /(\d{4})(\d{2})(\d{2})/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const [, y, mo, d] = m;
      return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }
  return null;
}

export function generateKeywords(title: string, content: string): string {
  // 简单关键词提取：从标题和正文中提取高频词
  const text = (title + " " + content).replace(/[，。；：！？、""''（）【】《》]/g, " ");
  const words = text.split(/\s+/).filter((w) => w.length >= 4 && w.length <= 12);
  const freq: Record<string, number> = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;
  const top = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([w]) => w);
  return top.join(",");
}
