import { schedule } from "node-cron";
import { runCrawler } from "@/lib/crawler/index";
import { existsSync, writeFileSync, unlinkSync } from "fs";
import { join } from "path";

let scheduled = false;
const LOCK_FILE = join(process.cwd(), ".crawler-scheduler.lock");

function acquireLock(): boolean {
  try {
    if (existsSync(LOCK_FILE)) {
      const pid = Number(require("fs").readFileSync(LOCK_FILE, "utf-8"));
      try {
        process.kill(pid, 0);
        return false;
      } catch {
        // 进程已不存在，删除旧锁
        unlinkSync(LOCK_FILE);
      }
    }
    writeFileSync(LOCK_FILE, String(process.pid));
    return true;
  } catch {
    return false;
  }
}

export function startCrawlerScheduler() {
  if (scheduled) return;
  if (!acquireLock()) {
    console.log("[scheduler] 其他进程已持有调度器锁，跳过启动");
    return;
  }
  scheduled = true;

  // 每周一凌晨 3:00 执行全量抓取
  schedule("0 3 * * 1", async () => {
    console.log("[scheduler] 开始每周政策抓取任务", new Date().toISOString());
    try {
      await runCrawler("all");
      console.log("[scheduler] 政策抓取任务完成");
    } catch (e) {
      console.error("[scheduler] 政策抓取任务失败:", e);
    }
  });

  console.log("[scheduler] 爬虫调度器已启动，每周一凌晨 3:00 执行");
}
