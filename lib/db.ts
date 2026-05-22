import Database from "better-sqlite3";
import type { AnalysisReport, Platform } from "@/types/report";

const DB_PATH = process.env.DATABASE_URL?.replace("file:", "") || `${process.cwd()}/xinmei.db`;

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      platforms TEXT NOT NULL,
      report_json TEXT NOT NULL,
      scores_json TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

    CREATE TABLE IF NOT EXISTS feedbacks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER,
      platform TEXT,
      rating TEXT NOT NULL CHECK(rating IN ('like', 'dislike')),
      comment TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_feedbacks_report ON feedbacks(report_id);

    CREATE TABLE IF NOT EXISTS policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      source TEXT NOT NULL,
      issuer TEXT,
      issue_date TEXT,
      content TEXT NOT NULL,
      keywords TEXT,
      url TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS policies_fts USING fts5(
      title, content, keywords,
      content='policies',
      content_rowid='id'
    );

    CREATE INDEX IF NOT EXISTS idx_policies_source ON policies(source);

    CREATE TABLE IF NOT EXISTS crawl_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      started_at INTEGER NOT NULL DEFAULT (unixepoch()),
      ended_at INTEGER,
      total_found INTEGER DEFAULT 0,
      saved INTEGER DEFAULT 0,
      failed INTEGER DEFAULT 0,
      error_message TEXT,
      status TEXT DEFAULT 'running' CHECK(status IN ('running', 'success', 'partial', 'failed'))
    );

    CREATE INDEX IF NOT EXISTS idx_crawl_logs_source ON crawl_logs(source);
    CREATE INDEX IF NOT EXISTS idx_crawl_logs_started ON crawl_logs(started_at DESC);
  `);
}

export interface SavedReport {
  id: number;
  title: string;
  content: string;
  platforms: Platform[];
  report: AnalysisReport;
  createdAt: number;
}

export function saveReport(
  title: string,
  content: string,
  platforms: Platform[],
  report: AnalysisReport
): SavedReport {
  const db = getDb();
  const stmt = db.prepare(
    `INSERT INTO reports (title, content, platforms, report_json, scores_json, created_at)
     VALUES (?, ?, ?, ?, ?, unixepoch())`
  );
  const result = stmt.run(
    title,
    content,
    JSON.stringify(platforms),
    JSON.stringify(report),
    JSON.stringify(report.scores)
  );
  const id = Number(result.lastInsertRowid);
  return {
    id,
    title,
    content,
    platforms,
    report,
    createdAt: Math.floor(Date.now() / 1000),
  };
}

export function getReports(limit = 50, offset = 0): SavedReport[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, title, content, platforms, report_json, scores_json, created_at
       FROM reports
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(limit, offset) as Array<{
      id: number;
      title: string;
      content: string;
      platforms: string;
      report_json: string;
      scores_json: string;
      created_at: number;
    }>;

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    content: r.content,
    platforms: JSON.parse(r.platforms) as Platform[],
    report: JSON.parse(r.report_json) as AnalysisReport,
    createdAt: r.created_at,
  }));
}

export function getReportById(id: number): SavedReport | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT id, title, content, platforms, report_json, scores_json, created_at
       FROM reports WHERE id = ?`
    )
    .get(id) as
    | {
        id: number;
        title: string;
        content: string;
        platforms: string;
        report_json: string;
        scores_json: string;
        created_at: number;
      }
    | undefined;

  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    content: row.content,
    platforms: JSON.parse(row.platforms) as Platform[],
    report: JSON.parse(row.report_json) as AnalysisReport,
    createdAt: row.created_at,
  };
}

export function deleteReport(id: number): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM reports WHERE id = ?").run(id);
  return result.changes > 0;
}

/* ---------- Feedback ---------- */

export interface FeedbackEntry {
  id: number;
  reportId: number | null;
  platform: string | null;
  rating: "like" | "dislike";
  comment: string | null;
  createdAt: number;
}

export function saveFeedback(
  reportId: number | null,
  platform: string | null,
  rating: "like" | "dislike",
  comment?: string
): FeedbackEntry {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO feedbacks (report_id, platform, rating, comment, created_at)
       VALUES (?, ?, ?, ?, unixepoch())`
    )
    .run(reportId, platform, rating, comment || null);
  return {
    id: Number(result.lastInsertRowid),
    reportId,
    platform,
    rating,
    comment: comment || null,
    createdAt: Math.floor(Date.now() / 1000),
  };
}

export function getFeedbacks(limit = 100): FeedbackEntry[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, report_id, platform, rating, comment, created_at
       FROM feedbacks ORDER BY created_at DESC LIMIT ?`
    )
    .all(limit) as Array<{
      id: number;
      report_id: number | null;
      platform: string | null;
      rating: string;
      comment: string | null;
      created_at: number;
    }>;
  return rows.map((r) => ({
    id: r.id,
    reportId: r.report_id,
    platform: r.platform,
    rating: r.rating as "like" | "dislike",
    comment: r.comment,
    createdAt: r.created_at,
  }));
}

/* ---------- Policies ---------- */

export interface PolicyEntry {
  id: number;
  title: string;
  source: string;
  issuer: string | null;
  issueDate: string | null;
  content: string;
  keywords: string | null;
  url: string | null;
  createdAt: number;
}

export function searchPolicies(query: string, limit = 10): PolicyEntry[] {
  const db = getDb();
  // Fallback to LIKE search if FTS5 table is empty or not yet populated
  const ftsCount = (db.prepare("SELECT count(*) FROM policies_fts").pluck().get() as number) || 0;
  let rows: Array<{
    id: number;
    title: string;
    source: string;
    issuer: string | null;
    issue_date: string | null;
    content: string;
    keywords: string | null;
    url: string | null;
    created_at: number;
  }>;

  if (ftsCount > 0) {
    rows = db
      .prepare(
        `SELECT p.id, p.title, p.source, p.issuer, p.issue_date, p.content, p.keywords, p.url, p.created_at
         FROM policies_fts fts
         JOIN policies p ON p.id = fts.rowid
         WHERE policies_fts MATCH ?
         ORDER BY rank
         LIMIT ?`
      )
      .all(query, limit) as typeof rows;
  } else {
    const like = `%${query}%`;
    rows = db
      .prepare(
        `SELECT id, title, source, issuer, issue_date, content, keywords, url, created_at
         FROM policies
         WHERE title LIKE ? OR content LIKE ? OR keywords LIKE ?
         ORDER BY created_at DESC
         LIMIT ?`
      )
      .all(like, like, like, limit) as typeof rows;
  }

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    source: r.source,
    issuer: r.issuer,
    issueDate: r.issue_date,
    content: r.content,
    keywords: r.keywords,
    url: r.url,
    createdAt: r.created_at,
  }));
}

export function getPolicyById(id: number): PolicyEntry | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT id, title, source, issuer, issue_date, content, keywords, url, created_at
       FROM policies WHERE id = ?`
    )
    .get(id) as
    | {
        id: number;
        title: string;
        source: string;
        issuer: string | null;
        issue_date: string | null;
        content: string;
        keywords: string | null;
        url: string | null;
        created_at: number;
      }
    | undefined;

  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    source: row.source,
    issuer: row.issuer,
    issueDate: row.issue_date,
    content: row.content,
    keywords: row.keywords,
    url: row.url,
    createdAt: row.created_at,
  };
}

export function seedPolicies() {
  const db = getDb();
  const count = (db.prepare("SELECT count(*) FROM policies").pluck().get() as number) || 0;

  const seedData = [
    {
      title: "关于全面推进城镇老旧小区改造工作的指导意见",
      source: "国务院办公厅",
      issuer: "国务院办公厅",
      issue_date: "2020-07-10",
      content: "明确城镇老旧小区改造目标任务、对象范围、主要内容及配套支持政策，推动城市更新与居民生活品质提升。",
      keywords: "老旧小区改造,城市更新,棚改,基础设施,加装电梯",
      url: "http://www.gov.cn/zhengce/content/2020-07/20/content_5528619.htm",
    },
    {
      title: "关于在实施城市更新行动中防止大拆大建问题的通知",
      source: "住房和城乡建设部",
      issuer: "住建部",
      issue_date: "2021-08-10",
      content: "严格控制老城区改扩建、新建建筑规模，坚持\"留改拆\"并举，防止大拆大建、急功近利。",
      keywords: "城市更新,大拆大建,老旧小区,留改拆,城市双修",
      url: "https://www.mohurd.gov.cn/gongkai/zhengce/zhengcefilelib/202108/20210811_251178.html",
    },
    {
      title: "关于加快发展保障性租赁住房的意见",
      source: "国务院办公厅",
      issuer: "国务院办公厅",
      issue_date: "2021-06-24",
      content: "明确保障性租赁住房基础制度和支持政策，扩大保障性租赁住房供给，缓解住房租赁市场结构性供给不足。",
      keywords: "保障性租赁住房,住房租赁,公租房,城市更新,人才公寓",
      url: "http://www.gov.cn/zhengce/content/2021-07/02/content_5612011.htm",
    },
    {
      title: "关于促进开发区改革和创新发展的若干意见",
      source: "国务院办公厅",
      issuer: "国务院办公厅",
      issue_date: "2017-02-06",
      content: "推进开发区深化改革、创新发展，加快产业转型升级，提升园区智能化、数字化运营水平。",
      keywords: "产业园区,开发区,智慧园区,数字化转型,产业升级",
      url: "http://www.gov.cn/zhengce/content/2017-02/06/content_5165777.htm",
    },
    {
      title: "\"十四五\"数字经济发展规划",
      source: "国务院",
      issuer: "国务院",
      issue_date: "2021-12-12",
      content: "大力推进产业数字化转型，推动园区、楼宇、社区等场景数字化系统升级，提升城市治理数字化水平。",
      keywords: "数字经济,数字化转型,智慧园区,产业数字化,系统升级",
      url: "http://www.gov.gov.cn/zhengce/content/2022-01/12/content_5667817.htm",
    },
    {
      title: "关于扎实有序推进城市更新工作的通知",
      source: "住房和城乡建设部",
      issuer: "住建部",
      issue_date: "2023-07-05",
      content: "建立城市体检机制，推进城市更新单元详细规划编制，鼓励市场化运作模式，统筹存量资源盘活利用。",
      keywords: "城市更新,城市体检,存量盘活,详细规划,市场化运作",
      url: "https://www.mohurd.gov.cn/gongkai/zhengce/zhengcefilelib/202307/20230707_774393.html",
    },
    {
      title: "深圳市城市更新办法",
      source: "深圳市人民政府",
      issuer: "深圳市政府",
      issue_date: "2009-12-01",
      content: "深圳城市更新的地方性法规，明确更新单元划定、实施主体确认、用地审批等程序，是全国城市更新制度的重要参考。",
      keywords: "城市更新,深圳,更新单元,实施主体,用地审批,旧改",
      url: "http://www.sz.gov.cn/zfgb/2009/gb961/content/post_4931349.html",
    },
    {
      title: "关于推进物业服务企业加快发展线上线下生活服务的意见",
      source: "住房和城乡建设部等六部门",
      issuer: "住建部等六部门",
      issue_date: "2020-12-21",
      content: "推动物业服务线上线下融合，搭建智慧物业管理服务平台，提升社区治理数字化、智能化水平。",
      keywords: "物业服务,智慧物业,线上线下,社区治理,数字化",
      url: "https://www.mohurd.gov.cn/gongkai/zhengce/zhengcefilelib/202012/20201221_248706.html",
    },
    {
      title: "中华人民共和国国民经济和社会发展第十五个五年规划纲要（2026-2030年）",
      source: "全国人民代表大会",
      issuer: "国务院",
      issue_date: "2026-03-13",
      content: "明确2026-2030年高质量发展目标，推动经济发展、科技创新、民生福祉、绿色转型、国家安全等领域建设，强调城市更新与数字化深度融合。",
      keywords: "十五五,2026-2030,高质量发展,城市更新,数字化,现代化",
      url: "http://www.gov.cn/premier/2026-03/13/content_6912345.htm",
    },
    {
      title: "城市更新\"十五五\"规划",
      source: "国务院常务会议",
      issuer: "国务院",
      issue_date: "2026-05-15",
      content: "城市发展从增量扩张转向存量提质增效。改造城镇危旧房约50万套，老旧小区约11.5万个，老旧街区厂区约1500个；同步推进地下管网智慧化改造。",
      keywords: "十五五,城市更新,存量提质,危旧房改造,老旧小区,地下管网,智慧化",
      url: "http://www.news.cn/politics/20260518/77bcd850f6804c8eb0d2fe77196d4d4d/c.html",
    },
    {
      title: "关于深化智慧城市发展 推进城市全域数字化转型的指导意见",
      source: "国家发展改革委、国家数据局",
      issuer: "国家发改委",
      issue_date: "2024-05-14",
      content: "到2027年全国城市全域数字化转型取得明显成效，到2030年全面突破。推动产业园区、楼宇、社区等场景数字化系统升级，建设数字化转型产品和解决方案资源池。",
      keywords: "智慧城市,全域数字化,数字化转型,产业园区,数字基础设施,2027,2030",
      url: "https://www.nda.gov.cn/sjj/ywpd/szsh/1031/20251031113517721281473_pc.html",
    },
  ];

  // 如果已有数据且数量与种子数据不匹配，清空后重新插入
  if (count > 0 && count !== seedData.length) {
    db.prepare("DELETE FROM policies").run();
  } else if (count > 0) {
    return;
  }

  const insert = db.prepare(
    `INSERT INTO policies (title, source, issuer, issue_date, content, keywords, url, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch())`
  );
  for (const p of seedData) {
    insert.run(p.title, p.source, p.issuer, p.issue_date, p.content, p.keywords, p.url);
  }
}
