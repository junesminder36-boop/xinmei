"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActionItem } from "@/types/report";
import { ClipboardList } from "lucide-react";

interface ActionListProps {
  items: ActionItem[];
  onHighlight?: (field: "标题" | "正文", text: string) => void;
}

export function ActionList({ items, onHighlight }: ActionListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="h-4 w-4 text-slate-500" />
          具体修改清单
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">暂无修改建议。</p>
        ) : (
          <ol className="space-y-3">
            {items.map((item, idx) => (
              <li
                key={idx}
                onClick={() =>
                  onHighlight?.(item.position || "正文", item.from)
                }
                className="cursor-pointer hover:bg-slate-50 transition-colors rounded-md flex items-start gap-3 text-sm p-1 -m-1"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                  {idx + 1}
                </span>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="line-through text-slate-400 bg-red-50 px-1 rounded">
                      {item.from}
                    </span>
                    <span className="text-slate-400">→</span>
                    <span className="font-medium text-slate-800 bg-green-50 px-1 rounded">
                      {item.to}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{item.reason}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
