import { getDb } from "@/lib/db";

export interface CrawledPolicy {
  title: string;
  source: string;
  issuer: string;
  issueDate: string;
  content: string;
  keywords: string;
  url: string;
}

export function saveCrawledPolicies(policies: CrawledPolicy[]): number {
  const db = getDb();
  let saved = 0;

  const checkStmt = db.prepare("SELECT id FROM policies WHERE url = ?");
  const insertStmt = db.prepare(
    `INSERT INTO policies (title, source, issuer, issue_date, content, keywords, url, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch())`
  );

  for (const p of policies) {
    try {
      const existing = checkStmt.get(p.url);
      if (existing) continue;
      insertStmt.run(
        p.title,
        p.source,
        p.issuer,
        p.issueDate,
        p.content,
        p.keywords,
        p.url
      );
      saved++;
    } catch (e) {
      console.error(`入库失败: ${p.url}`, e);
    }
  }

  return saved;
}

export interface CrawlLogEntry {
  id: number;
  source: string;
  startedAt: number;
  endedAt: number | null;
  totalFound: number;
  saved: number;
  failed: number;
  errorMessage: string | null;
  status: string;
}

export function startCrawlLog(source: string): number {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO crawl_logs (source, started_at, status) VALUES (?, unixepoch(), 'running')`
    )
    .run(source);
  return Number(result.lastInsertRowid);
}

export function finishCrawlLog(
  logId: number,
  status: "success" | "partial" | "failed",
  totalFound: number,
  saved: number,
  failed: number,
  errorMessage?: string
) {
  const db = getDb();
  db.prepare(
    `UPDATE crawl_logs
     SET ended_at = unixepoch(), status = ?, total_found = ?, saved = ?, failed = ?, error_message = ?
     WHERE id = ?`
  ).run(status, totalFound, saved, failed, errorMessage || null, logId);
}

export function getCrawlLogs(source?: string, limit = 50): CrawlLogEntry[] {
  const db = getDb();
  const sql = source
    ? `SELECT * FROM crawl_logs WHERE source = ? ORDER BY started_at DESC LIMIT ?`
    : `SELECT * FROM crawl_logs ORDER BY started_at DESC LIMIT ?`;
  const stmt = db.prepare(sql);
  const rows = (source ? stmt.all(source, limit) : stmt.all(limit)) as Array<{
    id: number;
    source: string;
    started_at: number;
    ended_at: number | null;
    total_found: number;
    saved: number;
    failed: number;
    error_message: string | null;
    status: string;
  }>;

  return rows.map((r) => ({
    id: r.id,
    source: r.source,
    startedAt: r.started_at,
    endedAt: r.ended_at,
    totalFound: r.total_found,
    saved: r.saved,
    failed: r.failed,
    errorMessage: r.error_message,
    status: r.status,
  }));
}
