import * as cheerio from "cheerio";
import { chromium } from "playwright-core";

const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
];

export async function fetchText(url: string, retries = 3): Promise<string> {
  const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": ua,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
          "Accept-Encoding": "gzip, deflate, br",
          Connection: "keep-alive",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Upgrade-Insecure-Requests": "1",
          "Cache-Control": "max-age=0",
        },
        redirect: "follow",
        // @ts-ignore - Next.js fetch timeout
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (i === retries - 1) throw err;
      await delay(2000 * (i + 1) + Math.random() * 1000);
    }
  }
  throw new Error(`Failed to fetch ${url} after ${retries} retries`);
}

export async function fetchCheerio(url: string, retries = 3): Promise<cheerio.CheerioAPI> {
  const html = await fetchText(url, retries);
  return cheerio.load(html);
}

/**
 * 使用 Playwright 无头浏览器获取页面 HTML
 * 用于绕过严格的反爬机制（如 WAF、TLS 指纹检测）
 */
export async function fetchWithBrowser(url: string): Promise<string> {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      userAgent: USER_AGENTS[0],
      viewport: { width: 1280, height: 720 },
      locale: "zh-CN",
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    const html = await page.content();
    return html;
  } finally {
    await browser.close();
  }
}

export async function fetchCheerioWithBrowser(url: string): Promise<cheerio.CheerioAPI> {
  const html = await fetchWithBrowser(url);
  return cheerio.load(html);
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function randomDelay(min = 1500, max = 4000) {
  await delay(min + Math.random() * (max - min));
}

export function normalizeUrl(url: string, base: string): string {
  if (url.startsWith("http")) return url;
  if (url.startsWith("//")) return "https:" + url;
  if (url.startsWith("/")) {
    const u = new URL(base);
    return `${u.protocol}//${u.host}${url}`;
  }
  return new URL(url, base).href;
}
